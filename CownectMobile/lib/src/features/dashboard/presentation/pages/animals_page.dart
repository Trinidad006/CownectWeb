import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../animals/data/animal_repository.dart';
import '../../../animals/domain/animal.dart';
import '../../../auth/application/auth_providers.dart';
import '../../../../core/constants.dart';
import '../../../../core/app_router.dart';
import 'package:go_router/go_router.dart';

final _animalsProvider =
    StreamProvider.autoDispose.family<List<Animal>, String>((ref, userId) {
  return ref.watch(animalRepositoryProvider).watchAnimals(userId);
});

class AnimalsPage extends ConsumerWidget {
  const AnimalsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentAppUserProvider);
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final animalsAsync = ref.watch(_animalsProvider(user.id));

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          final animalsAsync = ref.read(_animalsProvider(user.id));
          final count = animalsAsync.valueOrNull?.length ?? 0;
          if (!user.isPremium && count >= AppConstants.maxAnimalsFreePlan) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Has alcanzado el límite de ${AppConstants.maxAnimalsFreePlan} animales del plan gratuito. Mejora a Premium para registrar animales ilimitados.',
                ),
                action: SnackBarAction(
                  label: 'Ver planes',
                  onPressed: () => context.go(AppRoute.choosePlan.path),
                ),
              ),
            );
            return;
          }
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            builder: (context) => _AnimalFormSheet(userId: user.id),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Agregar animal'),
      ),
      body: animalsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text(
            'Error al cargar animales: $error',
            textAlign: TextAlign.center,
          ),
        ),
        data: (animals) {
          if (animals.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.pets, size: 72, color: Colors.grey),
                    const SizedBox(height: 16),
                    Text(
                      'Aún no has registrado animales',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Agrega tu primer animal para comenzar a controlar vacunaciones y pesos.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.only(bottom: 100, top: 8),
            itemCount: animals.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final animal = animals[index];
              return _AnimalCard(animal: animal);
            },
          );
        },
      ),
    );
  }
}

class _AnimalCard extends ConsumerWidget {
  const _AnimalCard({required this.animal});

  final Animal animal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(animalRepositoryProvider);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: InkWell(
        onLongPress: () async {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (context) {
              return AlertDialog(
                title: const Text('Eliminar animal'),
                content: Text(
                  '¿Deseas eliminar a ${animal.nombre ?? 'este animal'}?',
                ),
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
              );
            },
          );

          if (confirm == true) {
            await repo.deleteAnimal(animal.id);
          }
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _AnimalAvatar(photoUrl: animal.foto),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      animal.nombre ?? 'Sin nombre',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (animal.numeroIdentificacion != null)
                      Text(
                        'ID: ${animal.numeroIdentificacion}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 12,
                      runSpacing: 6,
                      children: [
                        if (animal.raza != null)
                          _Chip(text: animal.raza!, color: Colors.blueGrey),
                        if (animal.especie != null)
                          _Chip(text: animal.especie!, color: Colors.indigo),
                        if (animal.sexo != null)
                          _Chip(
                            text: animal.sexo == 'M' ? 'Macho' : 'Hembra',
                            color: Colors.teal,
                          ),
                        _Chip(
                          text: animal.enVenta ? 'En venta' : 'Inventario',
                          color:
                              animal.enVenta ? Colors.orange : Colors.green,
                        ),
                      ],
                    ),
                    if (animal.precioVenta != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(
                          'Precio: \$${animal.precioVenta!.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimalAvatar extends StatelessWidget {
  const _AnimalAvatar({this.photoUrl});

  final String? photoUrl;

  @override
  Widget build(BuildContext context) {
    final radius = 36.0;
    if (photoUrl == null) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: Colors.grey.shade200,
        child: const Icon(Icons.pets, color: Colors.black54),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: CachedNetworkImage(
        imageUrl: photoUrl!,
        width: radius * 2,
        height: radius * 2,
        fit: BoxFit.cover,
        placeholder: (context, url) => const CircularProgressIndicator(),
        errorWidget: (context, url, error) => const Icon(Icons.error),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.text, required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color.darken(),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _AnimalFormSheet extends ConsumerStatefulWidget {
  const _AnimalFormSheet({required this.userId});

  final String userId;

  @override
  ConsumerState<_AnimalFormSheet> createState() => _AnimalFormSheetState();
}

class _AnimalFormSheetState extends ConsumerState<_AnimalFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _idController = TextEditingController();
  final _speciesController = TextEditingController();
  final _breedController = TextEditingController();
  final _priceController = TextEditingController();
  String? _sexo;
  bool _forSale = false;
  XFile? _imageFile;
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _idController.dispose();
    _speciesController.dispose();
    _breedController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      setState(() {
        _imageFile = file;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
    });

    final repo = ref.read(animalRepositoryProvider);
    try {
      final request = AnimalCreateRequest(
        usuarioId: widget.userId,
        nombre: _nameController.text.trim(),
        numeroIdentificacion: _idController.text.trim().isEmpty
            ? null
            : _idController.text.trim(),
        especie:
            _speciesController.text.trim().isEmpty ? null : _speciesController.text.trim(),
        raza:
            _breedController.text.trim().isEmpty ? null : _breedController.text.trim(),
        sexo: _sexo,
        enVenta: _forSale,
        precioVenta: _forSale && _priceController.text.trim().isNotEmpty
            ? double.tryParse(_priceController.text.trim())
            : null,
      );

      final animal = await repo.addAnimal(request);

      if (_imageFile != null) {
        final url = await repo.uploadAnimalPhoto(
          file: File(_imageFile!.path),
          userId: widget.userId,
          animalId: animal.id,
        );
        await repo.updateAnimal(animal.id, {'foto': url});
      }

      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al guardar: $error')),
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
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(
        bottom: bottom,
        left: 20,
        right: 20,
        top: 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Nuevo animal',
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
            const SizedBox(height: 12),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Nombre'),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Ingrese un nombre';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _idController,
                    decoration:
                        const InputDecoration(labelText: 'Número de identificación'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _speciesController,
                    decoration: const InputDecoration(labelText: 'Especie'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _breedController,
                    decoration: const InputDecoration(labelText: 'Raza'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Sexo'),
                    value: _sexo,
                    items: const [
                      DropdownMenuItem(value: 'M', child: Text('Macho')),
                      DropdownMenuItem(value: 'H', child: Text('Hembra')),
                    ],
                    onChanged: (value) => setState(() => _sexo = value),
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    value: _forSale,
                    onChanged: (value) {
                      setState(() {
                        _forSale = value;
                      });
                    },
                    title: const Text('Disponible para venta'),
                  ),
                  if (_forSale) ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _priceController,
                      decoration: const InputDecoration(labelText: 'Precio de venta'),
                      keyboardType: TextInputType.number,
                    ),
                  ],
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.photo_library),
                    label: Text(_imageFile == null
                        ? 'Agregar foto'
                        : 'Cambiar foto (${_imageFile!.name})'),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _submit,
                      child: _saving
                          ? const CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            )
                          : const Text('Guardar'),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

extension on Color {
  Color darken([double amount = .1]) {
    assert(amount >= 0 && amount <= 1);
    final hsl = HSLColor.fromColor(this);
    final hslDark = hsl.withLightness((hsl.lightness - amount).clamp(0.0, 1.0));
    return hslDark.toColor();
  }
}
