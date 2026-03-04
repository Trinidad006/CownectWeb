import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/app_router.dart';

class DashboardShell extends ConsumerWidget {
  const DashboardShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  static const _destinations = [
    _DashboardDestination(
      route: AppRoute.dashboardHome,
      label: 'Inicio',
      icon: LucideIcons.home,
    ),
    _DashboardDestination(
      route: AppRoute.dashboardAnimals,
      label: 'Animales',
      icon: LucideIcons.dog,
    ),
    _DashboardDestination(
      route: AppRoute.dashboardVaccinations,
      label: 'Vacunas',
      icon: LucideIcons.shieldCheck,
    ),
    _DashboardDestination(
      route: AppRoute.dashboardWeights,
      label: 'Pesos',
      icon: LucideIcons.activity,
    ),
    _DashboardDestination(
      route: AppRoute.dashboardProfile,
      label: 'Perfil',
      icon: LucideIcons.user,
    ),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        height: 72,
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) => shell.goBranch(index),
        destinations: _destinations
            .map(
              (dest) => NavigationDestination(
                icon: Icon(dest.icon),
                label: dest.label,
              ),
            )
            .toList(),
      ),
    );
  }

}

class _DashboardDestination {
  const _DashboardDestination({
    required this.route,
    required this.label,
    required this.icon,
  });

  final AppRoute route;
  final String label;
  final IconData icon;
}
