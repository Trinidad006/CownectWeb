import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../animals/data/animal_repository.dart';
import '../../../animals/domain/animal.dart';
import '../../../auth/application/auth_providers.dart';
import '../../../vaccinations/data/vaccination_repository.dart';
import '../../../vaccinations/domain/vaccination.dart';

final _vaccinationsProvider =
    StreamProvider.autoDispose.family<List<Vaccination>, String>((ref, userId) {
  return ref.watch(vaccinationRepositoryProvider).watchVaccinations(userId);
});

final _userAnimalsProvider =
    StreamProvider.autoDispose.family<List<Animal>, String>((ref, userId) {
  return ref.watch(animalRepositoryProvider).watchAnimals(userId);
});

class VaccinationsPage extends ConsumerWidget {
  const VaccinationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserProvider);
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final vaccinationsAsync = ref.watch(_vaccinationsProvider(user.id));

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            builder: (context) => _VaccinationFormSheet(userId: user.id),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Registrar vacuna'),
      ),
      body: vaccinationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text('Error: $error'),
        ),
        data: (vaccinations) {
          if (vaccinations.isEmpty) {
            return const _EmptyVaccinations();
          }
          return ListView.separated(
            padding: const EdgeInsets.only(bottom: 110, top: 8),
            itemCount: vaccinations.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final vaccination = vaccinations[index];
              return _VaccinationTile(vaccination: vaccination);
            },
          );
        },
      ),
    );
  }
}

class _VaccinationTile extends ConsumerWidget {
  const _VaccinationTile({required this.vaccination});

  final Vaccination vaccination;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(vaccinationRepositoryProvider);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: ListTile(
        title: Text(
          vaccination.tipoVacuna ?? 'Vacuna sin tipo',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (vaccination.fechaAplicacion != null)
              Text('Aplicada el: ${vaccination.fechaAplicacion}'),
            if (vaccination.proximaDosis != null)
              Text('Próxima dosis: ${vaccination.proximaDosis}'),
            if (vaccination.observaciones != null)
              Text('Notas: ${vaccination.observaciones}'),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline),
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Eliminar vacunación'),
                content:
                    const Text('¿Seguro que deseas eliminar este registro?'),
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
              await repo.deleteVaccination(vaccination.id);
            }
          },
        ),
      ),
    );
  }
}

class _EmptyVaccinations extends StatelessWidget {
  const _EmptyVaccinations();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.health_and_safety, size: 72, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'Registra tu primera vacunación',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Mantén el historial sanitario de tus animales al día.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _VaccinationFormSheet extends ConsumerStatefulWidget {
  const _VaccinationFormSheet({required this.userId});

  final String userId;

  @override
  ConsumerState<_VaccinationFormSheet> createState() =>
      _VaccinationFormSheetState();
}

class _VaccinationFormSheetState
    extends ConsumerState<_VaccinationFormSheet> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedAnimalId;
  final _tipoController = TextEditingController();
  final _fechaController = TextEditingController();
  final _proximaController = TextEditingController();
  final _notasController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _tipoController.dispose();
    _fechaController.dispose();
    _proximaController.dispose();
    _notasController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
    });

    final repo = ref.read(vaccinationRepositoryProvider);
    final vaccination = Vaccination(
      id: '',
      usuarioId: widget.userId,
      animalId: _selectedAnimalId!,
      tipoVacuna: _tipoController.text.trim(),
      fechaAplicacion:
          _fechaController.text.trim().isEmpty ? null : _fechaController.text.trim(),
      proximaDosis:
          _proximaController.text.trim().isEmpty ? null : _proximaController.text.trim(),
      observaciones:
          _notasController.text.trim().isEmpty ? null : _notasController.text.trim(),
    );

    try {
      await repo.addVaccination(vaccination);
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
    final animalsAsync = ref.watch(_userAnimalsProvider(widget.userId));
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
                'Primero debes registrar animales para asociar una vacunación.',
              );
            }
            _selectedAnimalId ??= animals.first.id;

            return Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Nueva vacunación',
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
                    value: _selectedAnimalId,
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
                    controller: _tipoController,
                    decoration:
                        const InputDecoration(labelText: 'Tipo de vacuna'),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Ingresa el tipo de vacuna';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _fechaController,
                    decoration: const InputDecoration(
                      labelText: 'Fecha de aplicación',
                      hintText: 'AAAA-MM-DD',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _proximaController,
                    decoration: const InputDecoration(
                      labelText: 'Próxima dosis',
                      hintText: 'AAAA-MM-DD',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _notasController,
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
