import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_providers.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/dashboard/presentation/dashboard_shell.dart';
import '../features/dashboard/presentation/pages/animals_page.dart';
import '../features/dashboard/presentation/pages/home_page.dart';
import '../features/dashboard/presentation/pages/profile_page.dart';
import '../features/dashboard/presentation/pages/vaccinations_page.dart';
import '../features/dashboard/presentation/pages/weights_page.dart';
import '../features/onboarding/presentation/choose_plan_screen.dart';
import '../features/splash/presentation/splash_screen.dart';

enum AppRoute {
  splash('/splash'),
  login('/auth/login'),
  register('/auth/register'),
  choosePlan('/choose-plan'),
  dashboard('/dashboard'),
  dashboardHome('home'),
  dashboardAnimals('animals'),
  dashboardVaccinations('vaccinations'),
  dashboardWeights('weights'),
  dashboardProfile('profile');

  const AppRoute(this.path);
  final String path;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = RouterNotifier(ref);
  return GoRouter(
    initialLocation: AppRoute.splash.path,
    navigatorKey: notifier.rootNavigatorKey,
    debugLogDiagnostics: false,
    refreshListenable: notifier,
    redirect: notifier.handleRedirect,
    routes: [
      GoRoute(
        path: AppRoute.splash.path,
        name: AppRoute.splash.name,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoute.register.path,
        name: AppRoute.register.name,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoute.choosePlan.path,
        name: AppRoute.choosePlan.name,
        builder: (context, state) => const ChoosePlanScreen(),
      ),
      GoRoute(
        path: AppRoute.dashboard.path,
        name: AppRoute.dashboard.name,
        // Si llegamos exactamente a /dashboard, redirigimos a /dashboard/home
        redirect: (context, state) =>
            '${AppRoute.dashboard.path}/${AppRoute.dashboardHome.path}',
        routes: [
          StatefulShellRoute.indexedStack(
            builder: (context, state, navigationShell) =>
                DashboardShell(shell: navigationShell),
            branches: [
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoute.dashboardHome.path,
                    name: AppRoute.dashboardHome.name,
                    builder: (context, state) => const DashboardHomePage(),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoute.dashboardAnimals.path,
                    name: AppRoute.dashboardAnimals.name,
                    builder: (context, state) => const AnimalsPage(),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoute.dashboardVaccinations.path,
                    name: AppRoute.dashboardVaccinations.name,
                    builder: (context, state) => const VaccinationsPage(),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoute.dashboardWeights.path,
                    name: AppRoute.dashboardWeights.name,
                    builder: (context, state) => const WeightsPage(),
                  ),
                ],
              ),
              StatefulShellBranch(
                routes: [
                  GoRoute(
                    path: AppRoute.dashboardProfile.path,
                    name: AppRoute.dashboardProfile.name,
                    builder: (context, state) => const ProfilePage(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class RouterNotifier extends ChangeNotifier {
  RouterNotifier(this.ref) {
    ref.listen(authStateChangesProvider, (_, __) => notifyListeners(), fireImmediately: true);
    ref.listen(appUserStreamProvider, (_, __) => notifyListeners(), fireImmediately: true);
  }

  final Ref ref;
  final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

  String? handleRedirect(BuildContext context, GoRouterState state) {
    final auth = ref.read(authStateChangesProvider);
    final user = auth.valueOrNull;
    final authLoading = auth.isLoading;

    final appUserAsync = ref.read(appUserStreamProvider);
    final appUser = appUserAsync.valueOrNull;
    final userLoading = appUserAsync.isLoading;

    final isSplash = state.uri.path == AppRoute.splash.path || state.matchedLocation == AppRoute.splash.path;
    final isAuthPath = state.matchedLocation.startsWith('/auth');
    final isChoosePlan = state.matchedLocation == AppRoute.choosePlan.path;
    final isDashboard = state.matchedLocation.startsWith(AppRoute.dashboard.path);

    if (authLoading || userLoading) {
      return isSplash ? null : AppRoute.splash.path;
    }

    if (user == null) {
      if (isAuthPath) return null;
      return AppRoute.login.path;
    }

    if (appUser == null) {
      return AppRoute.splash.path;
    }

    if (!appUser.isPremium) {
      if (isChoosePlan) return null;
      if (!isAuthPath) {
        return AppRoute.choosePlan.path;
      }
    }

    if (appUser.isPremium && isChoosePlan) {
      return AppRoute.dashboard.path;
    }

    if (isSplash || isAuthPath) {
      return AppRoute.dashboard.path;
    }

    if (isDashboard && state.matchedLocation == AppRoute.dashboard.path) {
      return '${AppRoute.dashboard.path}/${AppRoute.dashboardHome.path}';
    }

    return null;
  }
}
