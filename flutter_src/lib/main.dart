import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

// --- MAIN ENTRY POINT ---
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  // IMPORTANT: Run `flutterfire configure` to generate firebase_options.dart
  try {
    await Firebase.initializeApp();
  } catch (e) {
    print("Firebase init error: $e");
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

  // Returns color based on AQI value
  Color get statusColor {
    if (value <= 50) return const Color(0xFF4ADE80); // Green
    if (value <= 100) return const Color(0xFFFACC15); // Yellow
    if (value <= 200) return const Color(0xFFFB923C); // Orange
    return const Color(0xFFEF4444); // Red
  }

  // Returns status text based on AQI value
  String get statusText {
    if (value <= 50) return "Good";
    if (value <= 100) return "Moderate";
    if (value <= 200) return "Unhealthy";
    return "Hazardous";
  }
  
  // Returns health recommendation based on AQI value
  String get healthTip {
    if (value <= 50) return "Air quality is great! Perfect time for outdoor activities.";
    if (value <= 100) return "Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.";
    if (value <= 200) return "Everyone may begin to experience health effects. Limit outdoor time.";
    return "Emergency conditions. Avoid all outdoor physical activity.";
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
class LiveMonitorScreen extends StatefulWidget {
  const LiveMonitorScreen({super.key});

  @override
  State<LiveMonitorScreen> createState() => _LiveMonitorScreenState();
}

class _LiveMonitorScreenState extends State<LiveMonitorScreen> {
  String _locationText = "Detecting location...";
  bool _isLoadingLocation = true;

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  Future<void> _getLocation() async {
    try {
      // Check permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locationText = "Location Permission Denied";
            _isLoadingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locationText = "Location Permanently Denied";
          _isLoadingLocation = false;
        });
        return;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );

      // Reverse geocode to get address
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String city = place.locality ?? place.subAdministrativeArea ?? "Unknown";
        String country = place.country ?? "";
        setState(() {
          _locationText = "$city, $country";
          _isLoadingLocation = false;
        });
      }
    } catch (e) {
      setState(() {
        _locationText = "Your Location";
        _isLoadingLocation = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final database = FirebaseDatabase.instance.ref();
    final currentRef = database.child('aqi/current');

    return StreamBuilder<DatabaseEvent>(
      stream: currentRef.onValue,
      builder: (context, snapshot) {
        // Default values for simulation
        int value = 45;
        int timestamp = DateTime.now().millisecondsSinceEpoch;
        bool isConnected = false;

        if (snapshot.hasData && snapshot.data!.snapshot.value != null) {
          try {
            final data = snapshot.data!.snapshot.value as Map;
            value = (data['value'] as num?)?.toInt() ?? 45;
            timestamp = (data['timestamp'] as num?)?.toInt() ?? timestamp;
            isConnected = true;
          } catch (e) {
            // Keep default values
          }
        }

        final reading = AqiReading(value: value, timestamp: timestamp);
        final dateStr = DateFormat('MMM d, h:mm:ss a').format(
          DateTime.fromMillisecondsSinceEpoch(timestamp)
        );

        return AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                reading.statusColor.withOpacity(0.3),
                reading.statusColor.withOpacity(0.1),
              ],
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    // Connection status badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isConnected ? Colors.green.shade100 : Colors.amber.shade100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isConnected ? Icons.wifi : Icons.wifi_off,
                            size: 14,
                            color: isConnected ? Colors.green.shade700 : Colors.amber.shade700,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isConnected ? "Firebase Connected" : "Simulation Mode",
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isConnected ? Colors.green.shade700 : Colors.amber.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Location
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.location_on, size: 18, color: Colors.black54),
                        const SizedBox(width: 6),
                        if (_isLoadingLocation)
                          const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        else
                          Text(
                            _locationText.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.2,
                              color: Colors.black54,
                            ),
                          ),
                      ],
                    ),
                    
                    const SizedBox(height: 40),
                    
                    // Main AQI Card
                    Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 320),
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(40),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.air, size: 20, color: Colors.black45),
                              const SizedBox(width: 8),
                              Text(
                                "AIR QUALITY INDEX",
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 2,
                                  color: Colors.black45,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            "${reading.value}",
                            style: GoogleFonts.inter(
                              fontSize: 100,
                              fontWeight: FontWeight.w900,
                              color: reading.statusColor,
                              height: 1,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                            decoration: BoxDecoration(
                              color: reading.statusColor,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              reading.statusText.toUpperCase(),
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Last updated
                    Text(
                      "Last Updated: $dateStr",
                      style: const TextStyle(fontSize: 13, color: Colors.black45),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Health tip card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: reading.statusColor.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(Icons.info_outline, color: reading.statusColor),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  "Health Recommendation",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  reading.healthTip,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Colors.black54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
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
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("AQI Trends"),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: StreamBuilder<DatabaseEvent>(
          stream: historyRef.onValue,
          builder: (context, snapshot) {
            List<FlSpot> spots = [];
            int average = 0;
            int peak = 0;

            if (snapshot.hasData && snapshot.data!.snapshot.value != null) {
              try {
                final data = snapshot.data!.snapshot.value as Map;
                final sortedKeys = data.keys.toList()..sort();
                
                int total = 0;
                for (var key in sortedKeys) {
                  final timestamp = int.tryParse(key.toString()) ?? 0;
                  final value = (data[key] as num).toInt();
                  
                  if (timestamp > 0) {
                    spots.add(FlSpot(spots.length.toDouble(), value.toDouble()));
                    total += value;
                    if (value > peak) peak = value;
                  }
                }
                if (spots.isNotEmpty) {
                  average = total ~/ spots.length;
                }
              } catch (e) {
                // Handle error
              }
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Stats row
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        icon: Icons.trending_up,
                        label: "Average",
                        value: average.toString(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        icon: Icons.arrow_upward,
                        label: "Peak",
                        value: peak.toString(),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Chart
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Real-time Trend",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Expanded(
                          child: spots.isEmpty
                              ? const Center(
                                  child: Text(
                                    "Waiting for data...\nConnect Firebase to see trends.",
                                    textAlign: TextAlign.center,
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                )
                              : LineChart(
                                  LineChartData(
                                    gridData: FlGridData(
                                      show: true,
                                      drawVerticalLine: false,
                                      getDrawingHorizontalLine: (value) {
                                        return FlLine(
                                          color: Colors.grey.shade200,
                                          strokeWidth: 1,
                                        );
                                      },
                                    ),
                                    titlesData: FlTitlesData(
                                      bottomTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                      leftTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          reservedSize: 40,
                                          getTitlesWidget: (value, meta) {
                                            return Text(
                                              value.toInt().toString(),
                                              style: TextStyle(
                                                color: Colors.grey.shade500,
                                                fontSize: 12,
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      topTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                      rightTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                    ),
                                    borderData: FlBorderData(show: false),
                                    lineBarsData: [
                                      LineChartBarData(
                                        spots: spots,
                                        isCurved: true,
                                        color: const Color(0xFF6366F1),
                                        barWidth: 3,
                                        dotData: FlDotData(show: false),
                                        belowBarData: BarAreaData(
                                          show: true,
                                          gradient: LinearGradient(
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                            colors: [
                                              const Color(0xFF6366F1).withOpacity(0.3),
                                              const Color(0xFF6366F1).withOpacity(0.0),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.grey),
              const SizedBox(width: 6),
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
