import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';

// --- MAIN ENTRY POINT ---
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize Firebase (Assuming default options are generated)
  // Ensure you have generated firebase_options.dart using `flutterfire configure`
  try {
    await Firebase.initializeApp();
  } catch (e) {
    print("Firebase init error (ignore if running without config): $e");
  }
  runApp(const AqiApp());
}

// --- APP ROOT ---
class AqiApp extends StatelessWidget {
  const AqiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AQI Monitor',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueGrey),
        textTheme: GoogleFonts.interTextTheme(),
      ),
      home: const HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

// --- DATA MODEL ---
class AqiReading {
  final int value;
  final int timestamp;

  AqiReading({required this.value, required this.timestamp});

  factory AqiReading.fromMap(Map<dynamic, dynamic> map) {
    return AqiReading(
      value: map['value'] as int? ?? 0,
      timestamp: map['timestamp'] as int? ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Color get statusColor {
    if (value <= 50) return Colors.greenAccent.shade400;
    if (value <= 100) return Colors.yellowAccent.shade700;
    if (value <= 200) return Colors.orangeAccent.shade400;
    return Colors.redAccent.shade400;
  }

  String get statusText {
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 200) return "Unhealthy";
    return "Hazardous";
  }
}

// --- HOME SCREEN (Navigation) ---
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const LiveMonitorScreen(),
    const TrendsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.speed),
            label: 'Live Monitor',
          ),
          NavigationDestination(
            icon: Icon(Icons.show_chart),
            label: 'Trends',
          ),
        ],
      ),
    );
  }
}

// --- SCREEN 1: LIVE MONITOR ---
class LiveMonitorScreen extends StatelessWidget {
  const LiveMonitorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final database = FirebaseDatabase.instance.ref();
    final currentRef = database.child('aqi/current');

    return StreamBuilder<DatabaseEvent>(
      stream: currentRef.onValue,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        // --- SIMULATION / DEFAULT DATA (if no firebase data) ---
        int value = 0;
        int timestamp = DateTime.now().millisecondsSinceEpoch;

        if (snapshot.hasData && snapshot.data!.snapshot.value != null) {
          final data = snapshot.data!.snapshot.value as Map;
          value = data['value'] ?? 0;
          timestamp = data['timestamp'] ?? timestamp;
        } else {
           // Fallback UI for empty state
           value = 45; // Demo value
        }

        final reading = AqiReading(value: value, timestamp: timestamp);
        final dateStr = DateFormat('MMM d, h:mm:ss a').format(
          DateTime.fromMillisecondsSinceEpoch(timestamp)
        );

        return AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          color: reading.statusColor,
          child: SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Current AQI",
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black54),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.3),
                      border: Border.all(color: Colors.white, width: 4),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      "${reading.value}",
                      style: GoogleFonts.inter(
                        fontSize: 80,
                        fontWeight: FontWeight.w900,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Chip(
                    backgroundColor: Colors.white.withOpacity(0.9),
                    label: Text(
                      reading.statusText.toUpperCase(),
                      style: TextStyle(
                        fontSize: 20, 
                        fontWeight: FontWeight.bold,
                        color: reading.statusColor.withOpacity(1.0).withRed(reading.statusColor.red ~/ 2) // Darker shade for text
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  Text(
                    "Last Updated: $dateStr",
                    style: const TextStyle(fontSize: 14, color: Colors.black45),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// --- SCREEN 2: TRENDS (CHART) ---
class TrendsScreen extends StatelessWidget {
  const TrendsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final database = FirebaseDatabase.instance.ref();
    final historyRef = database.child('aqi/history').limitToLast(20);

    return Scaffold(
      appBar: AppBar(title: const Text("AQI Trends")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: StreamBuilder<DatabaseEvent>(
          stream: historyRef.onValue,
          builder: (context, snapshot) {
            if (!snapshot.hasData || snapshot.data!.snapshot.value == null) {
              return const Center(child: Text("Waiting for history data..."));
            }

            final data = snapshot.data!.snapshot.value as Map;
            final List<FlSpot> spots = [];

            // Sort by timestamp
            final sortedKeys = data.keys.toList()..sort();
            
            for (var key in sortedKeys) {
              // Assuming key is timestamp or stored inside
              // Structure: history/timestamp: value OR history/id: {timestamp, value}
              // Adapting to user req: "history/timestamp1: value"
              final timestamp = int.tryParse(key.toString()) ?? 0;
              final value = (data[key] as num).toDouble();
              
              if (timestamp > 0) {
                 spots.add(FlSpot(timestamp.toDouble(), value));
              }
            }

            if (spots.isEmpty) return const Center(child: Text("No valid data points"));

            return LineChart(
              LineChartData(
                gridData: FlGridData(show: true),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: false), // Too many timestamps to show text
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: true, reservedSize: 40),
                  ),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: true),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: Colors.blue,
                    barWidth: 3,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(show: true, color: Colors.blue.withOpacity(0.1)),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
