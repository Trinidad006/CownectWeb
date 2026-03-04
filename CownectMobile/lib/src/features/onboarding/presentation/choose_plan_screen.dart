import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/app_router.dart';
import '../../../core/constants.dart';
import '../../auth/application/auth_providers.dart';
import '../application/subscription_controller.dart';

class ChoosePlanScreen extends ConsumerWidget {
  const ChoosePlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appUser = ref.watch(currentAppUserProvider);
    final subscriptionState = ref.watch(subscriptionControllerProvider);
    final isProcessing = subscriptionState.isLoading;
    final errorMessage = subscriptionState.whenOrNull(
      error: (error, _) => error.toString(),
    );

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFFF8FAFC),
              Color(0xFFE2E8F0),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 12),
                Text(
                  appUser != null
                      ? 'Hola, ${appUser.nombre ?? appUser.email}'
                      : 'Selecciona tu plan',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Elige la experiencia que mejor se adapte a tu explotación ganadera.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey.shade700,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                if (errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      border: Border.all(color: Colors.red.shade200),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: Colors.red.shade400),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            errorMessage,
                            style: TextStyle(
                              color: Colors.red.shade600,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                _PlanCard(
                  title: 'Plan Gratuito',
                  price: '0',
                  currency: 'USD',
                  perks: [
                    'Registro de animales (vacuno) - hasta ${AppConstants.maxAnimalsFreePlan}',
                    'Control de vacunaciones',
                    'Registro de pesos',
                  ],
                  accentColor: Colors.grey.shade800,
                  onPrimaryTap: () {
                    context.go(AppRoute.dashboard.path);
                  },
                  primaryLabel: 'Seguir con Plan Gratuito',
                  isProcessing: false,
                ),
                const SizedBox(height: 20),
                _PlanCard(
                  title: 'Plan Premiun',
                  price: AppConstants.subscriptionPrice.toStringAsFixed(2),
                  currency: AppConstants.subscriptionCurrency,
                  perks: const [
                    'Animales ilimitados',
                    'Pagos integrados con PayPal',
                    'Soporte prioritario',
                  ],
                  accentColor: const Color(0xFF009F6B),
                  highlight: true,
                  onPrimaryTap: isProcessing
                      ? null
                      : () async {
                          try {
                            await ref
                                .read(subscriptionControllerProvider.notifier)
                                .startSubscriptionFlow(context);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                      'Suscripción completada. ¡Ya eres premium!'),
                                ),
                              );
                              context.go(AppRoute.dashboard.path);
                            }
                          } catch (error) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(error.toString()),
                              ),
                            );
                          }
                        },
                  primaryLabel:
                      isProcessing ? 'Procesando...' : 'Contratar suscripción',
                  isProcessing: isProcessing,
                ),

                const SizedBox(height: 32),
                TextButton.icon(
                  onPressed: () {
                    context.go(AppRoute.dashboard.path);
                  },
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Regresar al dashboard'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.price,
    required this.currency,
    required this.perks,
    required this.accentColor,
    required this.onPrimaryTap,
    required this.primaryLabel,
    required this.isProcessing,
    this.highlight = false,
  });

  final String title;
  final String price;
  final String currency;
  final List<String> perks;
  final Color accentColor;
  final bool highlight;
  final VoidCallback? onPrimaryTap;
  final String primaryLabel;
  final bool isProcessing;

  @override
  Widget build(BuildContext context) {
    final cardColor = highlight ? Colors.white : Colors.white;
    final borderColor = highlight ? accentColor : Colors.black54;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: borderColor, width: highlight ? 2.5 : 1.5),
        boxShadow: [
          if (highlight)
            BoxShadow(
              color: accentColor.withOpacity(0.2),
              blurRadius: 24,
              offset: const Offset(0, 12),
            )
          else
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 12),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (highlight)
            Align(
              alignment: Alignment.topRight,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Recomendado',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '\$$price',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                      color: accentColor,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  '$currency / mes',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey.shade700,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: perks
                .map(
                  (perk) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle,
                          color: accentColor,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            perk,
                            style: Theme.of(context)
                                .textTheme
                                .bodyLarge
                                ?.copyWith(
                                  color: Colors.black87,
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: highlight ? accentColor : Colors.black,
                foregroundColor: Colors.white,
                textStyle: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              onPressed: onPrimaryTap,
              child: isProcessing && highlight
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.6,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(primaryLabel),
            ),
          ),
        ],
      ),
    );
  }
}
