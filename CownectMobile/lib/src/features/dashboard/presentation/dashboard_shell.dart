import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../application/dashboard_tab_provider.dart';
import 'pages/animals_page.dart';
import 'pages/home_page.dart';
import 'pages/profile_page.dart';
import 'pages/vaccinations_page.dart';
import 'pages/weights_page.dart';

/// Dashboard con barra inferior: navegación por [IndexedStack] (sin StatefulShellRoute).
class DashboardTabsScaffold extends ConsumerWidget {
  const DashboardTabsScaffold({super.key});

  static const _labels = [
    'Inicio',
    'Animales',
    'Vacunas',
    'Pesos',
    'Perfil',
  ];

  static const _icons = [
    LucideIcons.home,
    LucideIcons.dog,
    LucideIcons.shieldCheck,
    LucideIcons.activity,
    LucideIcons.user,
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tab = ref.watch(dashboardTabProvider);

    return Scaffold(
      body: IndexedStack(
        index: tab,
        sizing: StackFit.expand,
        children: const [
          DashboardHomePage(),
          AnimalsPage(),
          VaccinationsPage(),
          WeightsPage(),
          ProfilePage(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        height: 72,
        selectedIndex: tab,
        onDestinationSelected: (index) {
          ref.read(dashboardTabProvider.notifier).state = index;
        },
        destinations: List.generate(
          _labels.length,
          (i) => NavigationDestination(
            icon: Icon(_icons[i]),
            label: _labels[i],
          ),
        ),
      ),
    );
  }
}
