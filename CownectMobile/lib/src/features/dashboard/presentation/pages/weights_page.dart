import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../animals/data/animal_repository.dart';
import '../../../animals/domain/animal.dart';
import '../../../auth/application/auth_providers.dart';
import '../../../weights/data/weight_repository.dart';
import '../../../weights/domain/weight_record.dart';

final _weightsProvider =
    StreamProvider.autoDispose.family<List<WeightRecord>, String>((ref, userId) {
  return ref.watch(weightRepositoryProvider).watchWeights(userId);
});

final _animalsProvider =
    StreamProvider.autoDispose.family<List<Animal>, String>((ref, userId) {
  return ref.watch(animalRepositoryProvider).watchAnimals(userId);
});

class WeightsPage extends ConsumerWidget {
  const WeightsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserProvider);
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }
    final weightsAsync = ref.watch(_weightsProvider(user.id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesos'),
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            builder: (context) => _WeightFormSheet(userId: user.id),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Registrar peso'),
      ),
      body: weightsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Error: $error')),
        data: (weights) {
          if (weights.isEmpty) {
            return const _EmptyWeights();
          }
          return ListView.builder(
            padding: const EdgeInsets.only(bottom: 110, top: 8),
            itemCount: weights.length,
            itemBuilder: (context, index) {
              final record = weights[index];
              return _WeightTile(record: record);
            },
          );
        },
      ),
    );
  }
}

class _WeightTile extends ConsumerWidget {
  const _WeightTile({required this.record});

  final WeightRecord record;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(weightRepositoryProvider);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        title: Text(
          record.peso != null
              ? '${record.peso!.toStringAsFixed(1)} kg'
              : 'Peso sin especificar',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (record.fechaRegistro != null)
              Text('Fecha: ${record.fechaRegistro}'),
            if (record.observaciones != null)
              Text('Notas: ${record.observaciones}'),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline),
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Eliminar registro de peso'),
                content: const Text('¿Deseas eliminar este registro?'),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Cancelar'),
                  ),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(true),
                    child: const Text('Eliminar'),
                  ),
                ],
              ),
            );
            if (confirm == true) {
              await repo.deleteWeight(record.id);
            }
          },
        ),
      ),
    );
  }
}

class _EmptyWeights extends StatelessWidget {
  const _EmptyWeights();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.monitor_weight, size: 72, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'Aún no registras pesos',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Controla la evolución de tu ganado registrando sus pesos periódicamente.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _WeightFormSheet extends ConsumerStatefulWidget {
  const _WeightFormSheet({required this.userId});

  final String userId;

  @override
  ConsumerState<_WeightFormSheet> createState() => _WeightFormSheetState();
}

class _WeightFormSheetState extends ConsumerState<_WeightFormSheet> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedAnimalId;
  final _weightController = TextEditingController();
  final _dateController = TextEditingController();
  final _notesController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _weightController.dispose();
    _dateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
    });

    final repo = ref.read(weightRepositoryProvider);
    final record = WeightRecord(
      id: '',
      usuarioId: widget.userId,
      animalId: _selectedAnimalId!,
      peso: double.tryParse(_weightController.text.trim()),
      fechaRegistro:
          _dateController.text.trim().isEmpty ? null : _dateController.text.trim(),
      observaciones:
          _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    );

    try {
      await repo.addWeight(record);
      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final animalsAsync = ref.watch(_animalsProvider(widget.userId));
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(
        bottom: bottom,
        left: 20,
        right: 20,
        top: 24,
      ),
      child: SingleChildScrollView(
        child: animalsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Text('Error: $error'),
          data: (animals) {
            if (animals.isEmpty) {
              return const Text(
                'Registra animales antes de agregar pesos.',
              );
            }
            _selectedAnimalId ??= animals.first.id;

            return Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nuevo registro de peso',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedAnimalId,
                    items: animals
                        .map(
                          (animal) => DropdownMenuItem(
                            value: animal.id,
                            child: Text(animal.nombre ?? animal.id),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() {
                      _selectedAnimalId = value;
                    }),
                    decoration:
                        const InputDecoration(labelText: 'Animal asociado'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _weightController,
                    decoration:
                        const InputDecoration(labelText: 'Peso (kg)'),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Ingresa el peso';
                      }
                      if (double.tryParse(value) == null) {
                        return 'Ingresa un número válido';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _dateController,
                    decoration: const InputDecoration(
                      labelText: 'Fecha de registro',
                      hintText: 'AAAA-MM-DD',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Observaciones',
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _submit,
                      child: _saving
                          ? const CircularProgressIndicator(
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            )
                          : const Text('Guardar registro'),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
