import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../animals/data/animal_repository.dart';
import '../../animals/domain/animal.dart';
import '../../auth/application/auth_providers.dart';
import '../data/animal_certificates_repository.dart';
import '../domain/animal_certificate.dart';

final _animalByIdProvider = StreamProvider.autoDispose.family<Animal?, String>((
  ref,
  animalId,
) {
  return ref.watch(animalRepositoryProvider).watchAnimalById(animalId);
});

class AnimalDocumentationPage extends ConsumerStatefulWidget {
  const AnimalDocumentationPage({super.key, required this.animalId});

  final String animalId;

  @override
  ConsumerState<AnimalDocumentationPage> createState() =>
      _AnimalDocumentationPageState();
}

class _AnimalDocumentationPageState
    extends ConsumerState<AnimalDocumentationPage> {
  final _adminPasswordController = TextEditingController();
  final _txHashController = TextEditingController();

  bool _loadingCertificates = false;
  bool _autoGenerating = false;
  bool _adminValidating = false;
  bool _markReviewed = false;
  String? _error;
  String? _success;
  List<AnimalCertificate> _certificates = const [];

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _loadCertificates();
  }

  @override
  void dispose() {
    _adminPasswordController.dispose();
    _txHashController.dispose();
    super.dispose();
  }

  Future<void> _loadCertificates() async {
    setState(() {
      _loadingCertificates = true;
    });
    try {
      final list = await ref
          .read(animalCertificatesRepositoryProvider)
          .getByAnimal(widget.animalId);
      if (!mounted) return;
      setState(() {
        _certificates = list;
      });
    } catch (e) {
      if (!mounted) return;
      final message = e.toString().replaceFirst('Exception: ', '');
      setState(() {
        _error = message;
      });
      _showMessage(message, isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _loadingCertificates = false;
        });
      }
    }
  }

  Future<void> _generateAutomatic(String userId) async {
    setState(() {
      _error = null;
      _success = null;
      _autoGenerating = true;
    });
    try {
      await ref
          .read(animalCertificatesRepositoryProvider)
          .createAutomatic(userId: userId, animalId: widget.animalId);
      await _loadCertificates();
      if (!mounted) return;
      setState(() {
        _success = 'Certificado generado correctamente';
      });
      _showMessage('Certificado generado correctamente');
    } catch (e) {
      if (!mounted) return;
      final message = e.toString().replaceFirst('Exception: ', '');
      setState(() {
        _error = message;
      });
      _showMessage(message, isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _autoGenerating = false;
        });
      }
    }
  }

  Future<void> _adminValidateOnly() async {
    final adminPassword = _adminPasswordController.text.trim();
    if (adminPassword.isEmpty) {
      const msg = 'Ingresa la contraseña de administrador';
      setState(() => _error = msg);
      _showMessage(msg, isError: true);
      return;
    }
    setState(() {
      _error = null;
      _success = null;
      _adminValidating = true;
    });
    try {
      await ref
          .read(animalCertificatesRepositoryProvider)
          .adminValidate(
            animalId: widget.animalId,
            adminPassword: adminPassword,
          );
      if (!mounted) return;
      setState(() {
        _success = 'Animal marcado como revisado por administración';
      });
      _showMessage('Animal marcado como revisado por administración');
    } catch (e) {
      if (!mounted) return;
      final message = e.toString().replaceFirst('Exception: ', '');
      setState(() {
        _error = message;
      });
      _showMessage(message, isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _adminValidating = false;
        });
      }
    }
  }

  Future<void> _markReviewedWithTxHash() async {
    final adminPassword = _adminPasswordController.text.trim();
    final txHash = _txHashController.text.trim();
    if (adminPassword.isEmpty) {
      const msg = 'Ingresa la contraseña de administrador';
      setState(() => _error = msg);
      _showMessage(msg, isError: true);
      return;
    }
    if (txHash.isEmpty) {
      const msg = 'Ingresa un txHash para validar';
      setState(() => _error = msg);
      _showMessage(msg, isError: true);
      return;
    }

    setState(() {
      _error = null;
      _success = null;
      _markReviewed = true;
    });
    try {
      await ref
          .read(animalCertificatesRepositoryProvider)
          .markReviewedWithTxHash(
            animalId: widget.animalId,
            adminPassword: adminPassword,
            txHash: txHash,
          );
      _txHashController.clear();
      await _loadCertificates();
      if (!mounted) return;
      setState(() {
        _success = 'Certificado vinculado y animal revisado';
      });
      _showMessage('Certificado vinculado y animal revisado');
    } catch (e) {
      if (!mounted) return;
      final message = e.toString().replaceFirst('Exception: ', '');
      setState(() {
        _error = message;
      });
      _showMessage(message, isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _markReviewed = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentAppUserProvider);
    final animalAsync = ref.watch(_animalByIdProvider(widget.animalId));

    return Scaffold(
      appBar: AppBar(title: const Text('Documentación y Certificados')),
      body: animalAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) =>
            Center(child: Text('Error cargando animal: $error')),
        data: (animal) {
          if (animal == null) {
            return const Center(child: Text('Animal no encontrado'));
          }
          final isPremium = user?.isPremium ?? false;
          final hasCertificate = _certificates.isNotEmpty;

          return RefreshIndicator(
            onRefresh: _loadCertificates,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _AnimalHeader(animal: animal),
                const SizedBox(height: 12),
                if (_loadingCertificates)
                  const Center(child: CircularProgressIndicator())
                else
                  _CertificatesCard(certificates: _certificates),
                const SizedBox(height: 12),
                if (isPremium && !hasCertificate)
                  _ActionsCard(
                    revisadoParaVenta: animal.revisadoParaVenta,
                    autoGenerating: _autoGenerating,
                    adminValidating: _adminValidating,
                    markReviewed: _markReviewed,
                    adminPasswordController: _adminPasswordController,
                    txHashController: _txHashController,
                    onGenerateAutomatic: () => _generateAutomatic(user!.id),
                    onAdminValidate: _adminValidateOnly,
                    onMarkReviewed: _markReviewedWithTxHash,
                  ),
                if (isPremium && hasCertificate)
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(12),
                      child: Text(
                        'Este animal ya tiene un Certificado Cownect. No se pueden generar certificados adicionales.',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                if (_success != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      _success!,
                      style: const TextStyle(color: Colors.green),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _AnimalHeader extends StatelessWidget {
  const _AnimalHeader({required this.animal});

  final Animal animal;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              animal.nombre ?? 'Sin nombre',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            if (animal.numeroIdentificacion != null)
              Text('ID: ${animal.numeroIdentificacion!}'),
            const SizedBox(height: 6),
            Row(
              children: [
                Chip(
                  label: Text(
                    animal.revisadoParaVenta
                        ? 'Revisado por admin'
                        : 'Pendiente revisión',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CertificatesCard extends StatelessWidget {
  const _CertificatesCard({required this.certificates});

  final List<AnimalCertificate> certificates;

  @override
  Widget build(BuildContext context) {
    if (certificates.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(12),
          child: Text('Aún no hay certificados para este animal.'),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Certificados en blockchain',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ...certificates.map((c) {
              final tx = c.txHash;
              final txUrl = tx != null && tx.isNotEmpty
                  ? Uri.parse('https://amoy.polygonscan.com/tx/$tx')
                  : null;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  'Certificado Cownect #${c.cownectCertificateId ?? c.id}',
                ),
                subtitle: Text(c.createdAt.isEmpty ? 'Sin fecha' : c.createdAt),
                trailing: txUrl == null
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.open_in_new),
                        onPressed: () => launchUrl(
                          txUrl,
                          mode: LaunchMode.externalApplication,
                        ),
                      ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _ActionsCard extends StatelessWidget {
  const _ActionsCard({
    required this.revisadoParaVenta,
    required this.autoGenerating,
    required this.adminValidating,
    required this.markReviewed,
    required this.adminPasswordController,
    required this.txHashController,
    required this.onGenerateAutomatic,
    required this.onAdminValidate,
    required this.onMarkReviewed,
  });

  final bool revisadoParaVenta;
  final bool autoGenerating;
  final bool adminValidating;
  final bool markReviewed;
  final TextEditingController adminPasswordController;
  final TextEditingController txHashController;
  final VoidCallback onGenerateAutomatic;
  final VoidCallback onAdminValidate;
  final VoidCallback onMarkReviewed;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ElevatedButton(
              onPressed: (autoGenerating || !revisadoParaVenta)
                  ? null
                  : onGenerateAutomatic,
              child: Text(
                autoGenerating
                    ? 'Generando certificado...'
                    : 'Generar certificado automáticamente',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: adminPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Contraseña de administrador',
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: adminValidating ? null : onAdminValidate,
              child: Text(
                adminValidating
                    ? 'Marcando...'
                    : 'Marcar revisado (sin txHash)',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: txHashController,
              decoration: const InputDecoration(
                labelText:
                    'txHash (opcional para vincular certificado existente)',
              ),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: markReviewed ? null : onMarkReviewed,
              child: Text(markReviewed ? 'Validando...' : 'Validar con txHash'),
            ),
          ],
        ),
      ),
    );
  }
}
