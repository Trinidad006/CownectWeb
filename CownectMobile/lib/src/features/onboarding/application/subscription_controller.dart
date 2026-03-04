import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../auth/application/auth_providers.dart';
import '../../auth/domain/app_user.dart';
import '../data/subscription_repository.dart';

final subscriptionControllerProvider =
    StateNotifierProvider<SubscriptionController, AsyncValue<void>>((ref) {
  return SubscriptionController(
    ref: ref,
    repository: ref.watch(subscriptionRepositoryProvider),
  );
});

class SubscriptionController extends StateNotifier<AsyncValue<void>> {
  SubscriptionController({
    required Ref ref,
    required SubscriptionRepository repository,
  })  : _ref = ref,
        _repository = repository,
        super(const AsyncData(null));

  final Ref _ref;
  final SubscriptionRepository _repository;

  AppUser? get _currentUser => _ref.read(currentAppUserProvider);

  Future<void> startSubscriptionFlow(BuildContext context) async {
    final user = _currentUser;
    if (user == null) {
      throw Exception('No hay usuario autenticado');
    }

    state = const AsyncLoading();

    try {
      final orderId = await _repository.createSubscriptionOrder(user.id);
      final approveUrl = Uri.parse(
        'https://www.paypal.com/checkoutnow?token=$orderId',
      );

      final canLaunch = await canLaunchUrl(approveUrl);
      if (!canLaunch) {
        throw Exception('No se pudo abrir PayPal en este dispositivo.');
      }

      await launchUrl(approveUrl, mode: LaunchMode.externalApplication);

      if (!context.mounted) return;

      final confirmed = await _showConfirmationDialog(context);
      if (confirmed != true) {
        state = const AsyncData(null);
        return;
      }

      await _repository.captureSubscriptionOrder(orderId);
      await _ref.read(authRepositoryProvider).markPremium(user.id);
      state = const AsyncData(null);
    } catch (error, stack) {
      state = AsyncError(error, stack);
      rethrow;
    }
  }

  Future<bool?> _showConfirmationDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('¿Completaste el pago?'),
          content: const Text(
            'Una vez que autorices el pago en PayPal, pulsa “Confirmar” para activar tu plan premium.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Seguir pagando'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Confirmar'),
            ),
          ],
        );
      },
    );
  }
}
