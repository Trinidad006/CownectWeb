import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../animals/domain/animal.dart';
import '../../auth/application/auth_providers.dart';
import '../../auth/domain/app_user.dart';
import '../data/marketplace_repository.dart';

final marketplaceControllerProvider =
    StateNotifierProvider<MarketplaceController, AsyncValue<void>>((ref) {
  return MarketplaceController(
    ref: ref,
    repository: ref.watch(marketplaceRepositoryProvider),
  );
});

class MarketplaceController extends StateNotifier<AsyncValue<void>> {
  MarketplaceController({
    required Ref ref,
    required MarketplaceRepository repository,
  })  : _ref = ref,
        _repository = repository,
        super(const AsyncData(null));

  final Ref _ref;
  final MarketplaceRepository _repository;

  AppUser? get _currentUser => _ref.read(currentAppUserProvider);

  Future<void> startPurchaseFlow(BuildContext context, Animal animal) async {
    final user = _currentUser;
    if (user == null) {
      throw Exception('No hay usuario autenticado');
    }
    if (animal.precioVenta == null) {
      throw Exception('El animal no tiene precio de venta definido.');
    }

    state = const AsyncLoading();

    try {
      final orderId = await _repository.createOrder(
        amount: animal.precioVenta!,
        currency: 'USD',
        animalId: animal.id,
        buyerId: user.id,
      );

      final approveUrl =
          Uri.parse('https://www.paypal.com/checkoutnow?token=$orderId');

      if (!await canLaunchUrl(approveUrl)) {
        throw Exception(
          'No se pudo abrir PayPal, intenta desde otro dispositivo o navegador.',
        );
      }

      await launchUrl(approveUrl, mode: LaunchMode.externalApplication);

      if (!context.mounted) return;

      final confirmed = await _showConfirmDialog(context, animal);
      if (confirmed != true) {
        state = const AsyncData(null);
        return;
      }

      await _repository.captureOrder(orderId);
      state = const AsyncData(null);
    } catch (error, stack) {
      state = AsyncError(error, stack);
      rethrow;
    }
  }

  Future<bool?> _showConfirmDialog(
      BuildContext context, Animal animal) async {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar compra'),
        content: Text(
          'Una vez completes el pago en PayPal, presiona “Confirmar” para registrar la compra de ${animal.nombre ?? 'este animal'}.',
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
      ),
    );
  }
}
