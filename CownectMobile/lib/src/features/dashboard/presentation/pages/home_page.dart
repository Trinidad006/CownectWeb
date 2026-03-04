import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants.dart';
import '../../../auth/application/auth_providers.dart';
import '../../../auth/domain/app_user.dart';
import '../../../../core/app_router.dart';
import '../../data/dashboard_repository.dart';

final _animalsCountProvider =
    StreamProvider.autoDispose.family<int, String>((ref, userId) {
  return ref.watch(dashboardRepositoryProvider).animalsCount(userId);
});

final _vaccinationsCountProvider =
    StreamProvider.autoDispose.family<int, String>((ref, userId) {
  return ref.watch(dashboardRepositoryProvider).vaccinationsCount(userId);
});

final _weightsCountProvider =
    StreamProvider.autoDispose.family<int, String>((ref, userId) {
  return ref.watch(dashboardRepositoryProvider).weightsCount(userId);
});

class DashboardHomePage extends ConsumerWidget {
  const DashboardHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserProvider);
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          elevation: 0,
          backgroundColor: Colors.white,
          title: Text(
            'Tu panel',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList.list(
            children: [
              _HeaderCard(user: user),
              const SizedBox(height: 20),
              _OverviewGrid(user: user),
              const SizedBox(height: 20),
              _QuickActionsCard(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ],
    );
  }
}

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.user});

  final AppUser user;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(26),
        image: const DecorationImage(
          image: AssetImage('assets/images/logo_front.jpeg'),
          fit: BoxFit.cover,
          opacity: 0.08,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Hola, ${user.nombre ?? user.email}',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            user.isPremium
                ? 'Tu plan premium está activo. Registro de animales ilimitado.'
                : 'Tu plan gratuito está listo. Mejora a premium para animales ilimitados y más beneficios.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white70,
                ),
          ),
          const SizedBox(height: 16),
          if (!user.isPremium)
            ElevatedButton(
              onPressed: () {
                context.go(AppRoute.choosePlan.path);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
              ),
              child: const Text('Ver planes premium'),
            ),
        ],
      ),
    );
  }
}

class _OverviewGrid extends ConsumerWidget {
  const _OverviewGrid({required this.user});

  final AppUser user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final animalsCount = ref.watch(_animalsCountProvider(user.id));
    final vaccinationsCount = ref.watch(_vaccinationsCountProvider(user.id));
    final weightsCount = ref.watch(_weightsCountProvider(user.id));

    final animalsValue = animalsCount.maybeWhen(
      data: (count) {
        if (user.isPremium) {
          return '$count / ∞';
        }
        return '$count / ${AppConstants.maxAnimalsFreePlan}';
      },
      orElse: () => '—',
    );

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.25,
      children: [
        _OverviewTile(
          title: 'Cantidad de animales',
          value: animalsValue,
          icon: Icons.pets,
          color: Colors.green.shade600,
        ),
        _OverviewTile(
          title: 'Vacunaciones',
          value: vaccinationsCount.maybeWhen(
            data: (count) => count.toString(),
            orElse: () => '—',
          ),
          icon: Icons.health_and_safety,
          color: Colors.blue.shade600,
        ),
        _OverviewTile(
          title: 'Registros de peso',
          value: weightsCount.maybeWhen(
            data: (count) => count.toString(),
            orElse: () => '—',
          ),
          icon: Icons.monitor_weight,
          color: Colors.orange.shade600,
        ),
      ],
    );
  }
}

class _OverviewTile extends StatelessWidget {
  const _OverviewTile({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.12),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const Spacer(),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade700,
                ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionsCard extends StatelessWidget {
  const _QuickActionsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Acciones rápidas',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _QuickActionButton(
                icon: Icons.pets,
                label: 'Agregar animal',
                onTap: () {
                  context.go('${AppRoute.dashboard.path}/${AppRoute.dashboardAnimals.path}');
                },
              ),
              _QuickActionButton(
                icon: Icons.shield,
                label: 'Registrar vacuna',
                onTap: () {
                  context.go('${AppRoute.dashboard.path}/${AppRoute.dashboardVaccinations.path}');
                },
              ),
              _QuickActionButton(
                icon: Icons.monitor_weight,
                label: 'Registrar peso',
                onTap: () {
                  context.go('${AppRoute.dashboard.path}/${AppRoute.dashboardWeights.path}');
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(icon),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

