import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../animals/data/animal_repository.dart';
import '../../../animals/domain/animal.dart';
import '../../../auth/application/auth_providers.dart';
import '../../../marketplace/application/marketplace_controller.dart';

final _marketplaceProvider =
    StreamProvider.autoDispose.family<List<Animal>, String>((ref, userId) {
  return ref.watch(animalRepositoryProvider).watchMarketplace(
        excludeUserId: userId,
      );
});

class MarketplacePage extends ConsumerWidget {
  const MarketplacePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserProvider);
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final listings = ref.watch(_marketplaceProvider(user.id));
    final controllerState = ref.watch(marketplaceControllerProvider);
    final isProcessing = controllerState.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace'),
        elevation: 0,
      ),
      body: listings.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text(
            'Error al cargar marketplace: $error',
            textAlign: TextAlign.center,
          ),
        ),
        data: (animals) {
          if (animals.isEmpty) {
            return const _EmptyMarketplace();
          }
          return ListView.builder(
            padding: const EdgeInsets.only(bottom: 110, top: 8),
            itemCount: animals.length,
            itemBuilder: (context, index) {
              final animal = animals[index];
              return _ListingCard(
                animal: animal,
                onBuy: isProcessing
                    ? null
                    : () async {
                        try {
                          await ref
                              .read(marketplaceControllerProvider.notifier)
                              .startPurchaseFlow(context, animal);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content:
                                    Text('Compra registrada correctamente.'),
                              ),
                            );
                          }
                        } catch (error) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(error.toString())),
                          );
                        }
                      },
              );
            },
          );
        },
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  const _ListingCard({
    required this.animal,
    required this.onBuy,
  });

  final Animal animal;
  final VoidCallback? onBuy;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      clipBehavior: Clip.hardEdge,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (animal.foto != null)
            CachedNetworkImage(
              imageUrl: animal.foto!,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
            )
          else
            Container(
              height: 180,
              width: double.infinity,
              color: Colors.grey.shade200,
              child: const Icon(Icons.pets, size: 48),
            ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  animal.nombre ?? 'Animal sin nombre',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    if (animal.raza != null)
                      Chip(
                        label: Text(animal.raza!),
                        backgroundColor: Colors.blue.shade50,
                      ),
                    if (animal.especie != null)
                      Chip(
                        label: Text(animal.especie!),
                        backgroundColor: Colors.green.shade50,
                      ),
                    if (animal.sexo != null)
                      Chip(
                        label: Text(animal.sexo == 'M' ? 'Macho' : 'Hembra'),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(
                      animal.precioVenta != null
                          ? '\$${animal.precioVenta!.toStringAsFixed(2)}'
                          : 'Precio a convenir',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(Icons.verified, color: Colors.teal),
                    const SizedBox(width: 6),
                    const Text(
                      'Pago seguro con PayPal',
                      style: TextStyle(fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onBuy,
                    child: const Text('Comprar ahora'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyMarketplace extends StatelessWidget {
  const _EmptyMarketplace();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.storefront, size: 72, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No hay animales en venta por ahora',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Regresa más tarde o publica tus propios animales desde la vista de Animales.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
