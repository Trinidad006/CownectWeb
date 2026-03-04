import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/app_router.dart';
import '../../auth/application/auth_providers.dart';
import '../../auth/data/auth_repository.dart';
import 'widgets/auth_background.dart';
import 'widgets/auth_text_field.dart';
import 'widgets/auth_title.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nombreController = TextEditingController();
  final _apellidoController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _telefonoController = TextEditingController();
  final _ranchoController = TextEditingController();
  final _hectareasController = TextEditingController();
  final _paisController = TextEditingController();
  final _ciudadController = TextEditingController();
  final _direccionController = TextEditingController();
  final _descripcionController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nombreController.dispose();
    _apellidoController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _telefonoController.dispose();
    _ranchoController.dispose();
    _hectareasController.dispose();
    _paisController.dispose();
    _ciudadController.dispose();
    _direccionController.dispose();
    _descripcionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final request = RegisterRequest(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      nombre: _nombreController.text.trim(),
      apellido: _apellidoController.text.trim(),
      rancho: _ranchoController.text.trim(),
      telefono: _telefonoController.text.trim().isEmpty
          ? null
          : _telefonoController.text.trim(),
      ranchoHectareas: _hectareasController.text.trim().isEmpty
          ? null
          : double.tryParse(_hectareasController.text.trim()),
      ranchoPais: _paisController.text.trim().isEmpty
          ? null
          : _paisController.text.trim().toUpperCase(),
      ranchoCiudad: _ciudadController.text.trim().isEmpty
          ? null
          : _ciudadController.text.trim(),
      ranchoDireccion: _direccionController.text.trim().isEmpty
          ? null
          : _direccionController.text.trim(),
      ranchoDescripcion: _descripcionController.text.trim().isEmpty
          ? null
          : _descripcionController.text.trim(),
      moneda: null,
    );

    final controller = ref.read(authControllerProvider.notifier);
    await controller.register(request);
    final state = ref.read(authControllerProvider);
    state.when(
      data: (_) {
        _showSnackbar(
          'Cuenta creada. Revisa tu correo y confirma para iniciar sesión.',
        );
        context.go(AppRoute.login.path);
      },
      error: (error, _) {
        final message = error is AuthException ? error.message : error.toString();
        _showSnackbar(message);
      },
      loading: () {},
    );
  }

  void _showSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final isLoading = authState.isLoading;

    return AuthBackground(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Card(
              elevation: 12,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
              ),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const AuthTitle(
                        title: 'Crea tu cuenta',
                        subtitle:
                            'Completa tus datos para gestionar tu rancho con Cownect.',
                      ),
                      const SizedBox(height: 28),
                      Wrap(
                        spacing: 16,
                        runSpacing: 16,
                        children: [
                          SizedBox(
                            width: 260,
                            child: AuthTextField(
                              controller: _nombreController,
                              label: 'Nombre',
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Ingresa tu nombre';
                                }
                                return null;
                              },
                            ),
                          ),
                          SizedBox(
                            width: 260,
                            child: AuthTextField(
                              controller: _apellidoController,
                              label: 'Apellido',
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Ingresa tu apellido';
                                }
                                return null;
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        controller: _emailController,
                        label: 'Correo electrónico',
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Ingresa un correo';
                          }
                          if (!value.contains('@')) {
                            return 'Correo inválido';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        controller: _passwordController,
                        label: 'Contraseña',
                        obscureText: _obscurePassword,
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility
                                : Icons.visibility_off,
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Ingresa una contraseña';
                          }
                          if (value.length < 6) {
                            return 'Debe tener al menos 6 caracteres';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        controller: _confirmPasswordController,
                        label: 'Confirmar contraseña',
                        obscureText: _obscureConfirm,
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              _obscureConfirm = !_obscureConfirm;
                            });
                          },
                          icon: Icon(
                            _obscureConfirm
                                ? Icons.visibility
                                : Icons.visibility_off,
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Repite la contraseña';
                          }
                          if (value != _passwordController.text) {
                            return 'Las contraseñas no coinciden';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        controller: _telefonoController,
                        label: 'Teléfono (opcional)',
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        controller: _ranchoController,
                        label: 'Nombre del rancho',
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Ingresa el nombre del rancho';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 16,
                        runSpacing: 16,
                        children: [
                          SizedBox(
                            width: 180,
                            child: AuthTextField(
                              controller: _hectareasController,
                              label: 'Hectáreas',
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          SizedBox(
                            width: 200,
                            child: AuthTextField(
                              controller: _paisController,
                              label: 'País (ISO 2)',
                            ),
                          ),
                          SizedBox(
                            width: 220,
                            child: AuthTextField(
                              controller: _ciudadController,
                              label: 'Ciudad',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        controller: _direccionController,
                        label: 'Dirección',
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _descripcionController,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          labelText: 'Descripción del rancho',
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        height: 54,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _submit,
                          child: isLoading
                              ? const CircularProgressIndicator(
                                  valueColor:
                                      AlwaysStoppedAnimation<Color>(Colors.white),
                                )
                              : const Text('Crear cuenta'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('¿Ya tienes cuenta?'),
                          TextButton(
                            onPressed: () {
                              context.go(AppRoute.login.path);
                            },
                            child: const Text('Iniciar sesión'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
