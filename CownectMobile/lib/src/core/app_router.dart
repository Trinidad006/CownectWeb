import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_providers.dart';
import '../features/auth/domain/app_user.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/dashboard/presentation/dashboard_shell.dart';
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
        builder: (context, state) => const DashboardTabsScaffold(),
      ),
    ],
  );
});

class RouterNotifier extends ChangeNotifier {
  RouterNotifier(this.ref) {
    ref.listen<AsyncValue<User?>>(
      authStateChangesProvider,
      (previous, next) {
        if (_routerShouldRefreshForAuth(previous, next)) {
          notifyListeners();
        }
      },
      fireImmediately: true,
    );
    ref.listen<AsyncValue<AppUser?>>(
      appUserStreamProvider,
      (previous, next) {
        if (_routerShouldRefreshForAppUser(previous, next)) {
          notifyListeners();
        }
      },
      fireImmediately: true,
    );
  }

  final Ref ref;
  final GlobalKey<NavigatorState> rootNavigatorKey =
      GlobalKey<NavigatorState>();

  String? handleRedirect(BuildContext context, GoRouterState state) {
    final auth = ref.read(authStateChangesProvider);
    final user = auth.valueOrNull;
    final authLoading = auth.isLoading;

    final appUserAsync = ref.read(appUserStreamProvider);
    final appUser = appUserAsync.valueOrNull;
    final userLoading = appUserAsync.isLoading;

    final isSplash =
        state.uri.path == AppRoute.splash.path ||
        state.matchedLocation == AppRoute.splash.path;
    final isAuthPath = state.matchedLocation.startsWith('/auth');
    final isChoosePlan = state.matchedLocation == AppRoute.choosePlan.path;
    final isDashboard = state.matchedLocation.startsWith(
      AppRoute.dashboard.path,
    );

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

    // Eliminamos la redirección obligatoria a choosePlan para permitir el plan gratuito.
    // Solo redirigimos si el usuario es premium y está en la pantalla de elegir plan (para sacarlo de ahí).
    if (appUser.isPremium && isChoosePlan) {
      return AppRoute.dashboard.path;
    }

    if (isSplash || isAuthPath) {
      return AppRoute.dashboard.path;
    }

    if (isDashboard &&
        state.uri.path.startsWith(AppRoute.dashboard.path) &&
        state.uri.path != AppRoute.dashboard.path) {
      return AppRoute.dashboard.path;
    }

    return null;
  }
}

bool _routerShouldRefreshForAppUser(
  AsyncValue<AppUser?>? previous,
  AsyncValue<AppUser?> next,
) {
  if (next.isLoading) {
    return previous == null || !previous.isLoading;
  }
  if (next.hasError) return true;

  final prevUser = previous?.valueOrNull;
  final nextUser = next.valueOrNull;
  if ((prevUser == null) != (nextUser == null)) return true;
  if (nextUser == null) return false;
  if (prevUser == null) return true;
  return prevUser.id != nextUser.id || prevUser.isPremium != nextUser.isPremium;
}

bool _routerShouldRefreshForAuth(
  AsyncValue<User?>? previous,
  AsyncValue<User?> next,
) {
  if (next.isLoading) {
    return previous == null || !previous.isLoading;
  }
  if (next.hasError) return true;
  final prevUid = previous?.valueOrNull?.uid;
  final nextUid = next.valueOrNull?.uid;
  return prevUid != nextUid;
}
