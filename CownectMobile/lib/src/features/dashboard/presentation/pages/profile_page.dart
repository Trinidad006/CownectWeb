import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/application/auth_providers.dart';
import '../../../../core/app_router.dart';
import '../../../profile/data/profile_repository.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  bool _updatingPhoto = false;

  Future<void> _pickAndUploadPhoto(String userId) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (file == null) return;

    setState(() {
      _updatingPhoto = true;
    });

    try {
      final url = await ref
          .read(profileRepositoryProvider)
          .uploadProfilePhoto(userId, File(file.path));
      await ref.read(profileRepositoryProvider).updateProfile(userId, {
        'foto_perfil': url,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Foto de perfil actualizada')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al subir foto: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _updatingPhoto = false;
        });
      }
    }
  }

  Future<void> _editProfileDialog(BuildContext context, String userId) async {
    final user = ref.read(currentAppUserProvider);
    if (user == null) return;

    final nombreController = TextEditingController(text: user.nombre ?? '');
    final apellidoController = TextEditingController(text: user.apellido ?? '');
    final telefonoController = TextEditingController(text: user.telefono ?? '');
    final ranchoController = TextEditingController(text: user.rancho ?? '');
    final hectareasController = TextEditingController(
      text: user.ranchoHectareas?.toString() ?? '',
    );
    final paisController = TextEditingController(text: user.ranchoPais ?? '');
    final ciudadController = TextEditingController(text: user.ranchoCiudad ?? '');
    final direccionController = TextEditingController(text: user.ranchoDireccion ?? '');
    final descripcionController =
        TextEditingController(text: user.ranchoDescripcion ?? '');

    final formKey = GlobalKey<FormState>();
    bool saving = false;

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setLocalState) {
          Future<void> submit() async {
            if (!formKey.currentState!.validate()) return;
            setLocalState(() => saving = true);
            try {
              await ref.read(profileRepositoryProvider).updateProfile(userId, {
                'nombre': nombreController.text.trim(),
                'apellido': apellidoController.text.trim(),
                'telefono': telefonoController.text.trim(),
                'rancho': ranchoController.text.trim(),
                'rancho_hectareas': double.tryParse(hectareasController.text.trim()),
                'rancho_pais': paisController.text.trim().isEmpty
                    ? null
                    : paisController.text.trim().toUpperCase(),
                'rancho_ciudad':
                    ciudadController.text.trim().isEmpty ? null : ciudadController.text.trim(),
                'rancho_direccion':
                    direccionController.text.trim().isEmpty ? null : direccionController.text.trim(),
                'rancho_descripcion': descripcionController.text.trim().isEmpty
                    ? null
                    : descripcionController.text.trim(),
              });
              if (mounted) Navigator.of(context).pop();
            } catch (error) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error al guardar: $error')),
                );
              }
            } finally {
              setLocalState(() => saving = false);
            }
          }

          return AlertDialog(
            title: const Text('Editar perfil'),
            content: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: nombreController,
                      decoration: const InputDecoration(labelText: 'Nombre'),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Requerido' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: apellidoController,
                      decoration: const InputDecoration(labelText: 'Apellido'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: telefonoController,
                      decoration: const InputDecoration(labelText: 'Teléfono'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: ranchoController,
                      decoration: const InputDecoration(labelText: 'Nombre del rancho'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: hectareasController,
                      decoration: const InputDecoration(labelText: 'Hectáreas'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: paisController,
                      decoration: const InputDecoration(labelText: 'País (ISO 2)'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: ciudadController,
                      decoration: const InputDecoration(labelText: 'Ciudad'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: direccionController,
                      decoration: const InputDecoration(labelText: 'Dirección'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: descripcionController,
                      decoration: const InputDecoration(labelText: 'Descripción'),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: saving ? null : () => Navigator.of(context).pop(),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: saving ? null : submit,
                child: saving
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('Guardar'),
              ),
            ],
          );
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentAppUserProvider);
    if (user == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final authControllerState = ref.watch(authControllerProvider);
    final signingOut = authControllerState.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                CircleAvatar(
                  radius: 56,
                  backgroundColor: Colors.grey.shade200,
                  backgroundImage:
                      user.fotoPerfil != null ? CachedNetworkImageProvider(user.fotoPerfil!) : null,
                  child: user.fotoPerfil == null
                      ? Text(
                          (user.nombre?.substring(0, 1) ??
                                  user.email.substring(0, 1))
                              .toUpperCase(),
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 4,
                  child: FloatingActionButton.small(
                    heroTag: 'edit-photo',
                    onPressed:
                        _updatingPhoto ? null : () => _pickAndUploadPhoto(user.id),
                    child: _updatingPhoto
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.camera_alt_outlined),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              user.nombre ?? user.email,
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              user.email,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: user.isPremium ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                user.isPremium ? 'Plan Premium' : 'Plan Gratuito',
                style: TextStyle(
                  color: user.isPremium ? const Color(0xFF15803D) : Colors.black87,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Card(
              child: ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Editar información'),
                subtitle: const Text('Nombre, rancho, teléfono, descripción'),
                onTap: () => _editProfileDialog(context, user.id),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.workspace_premium),
                title: Text(user.isPremium
                    ? 'Gestionar suscripción'
                    : 'Obtener plan premium'),
                subtitle: Text(
                  user.isPremium
                      ? 'Tu plan premium está activo'
                      : 'Registro de animales ilimitados y más beneficios',
                ),
                onTap: () {
                  if (user.isPremium) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content:
                            Text('La suscripción se gestiona desde la web en este momento.'),
                      ),
                    );
                  } else {
                    context.go(AppRoute.choosePlan.path);
                  }
                },
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text(
                  'Cerrar sesión',
                  style: TextStyle(color: Colors.red),
                ),
                onTap: signingOut
                    ? null
                    : () async {
                        await ref.read(authControllerProvider.notifier).signOut();
                        if (context.mounted) {
                          context.go(AppRoute.login.path);
                        }
                      },
              ),
            ),
        ],
      ),
    );
  }
}
