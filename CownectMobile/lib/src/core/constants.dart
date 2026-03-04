class AppConstants {
  AppConstants._();

  static final double subscriptionPrice =
      double.parse(const String.fromEnvironment('SUBSCRIPTION_PRICE', defaultValue: '9.99'));

  static const String subscriptionCurrency = String.fromEnvironment(
    'SUBSCRIPTION_CURRENCY',
    defaultValue: 'USD',
  );

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://cownect-web.vercel.app',
  );

  /// Máximo de animales para plan gratuito. Plan premium: ilimitado.
  static const int maxAnimalsFreePlan = 300;
}
