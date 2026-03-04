import 'package:cloud_firestore/cloud_firestore.dart';

class Vaccination {
  Vaccination({
    required this.id,
    required this.usuarioId,
    required this.animalId,
    this.tipoVacuna,
    this.fechaAplicacion,
    this.proximaDosis,
    this.observaciones,
    this.createdAt,
    this.updatedAt,
  });

  factory Vaccination.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    return Vaccination(
      id: doc.id,
      usuarioId: data?['usuario_id'] as String? ?? '',
      animalId: data?['animal_id'] as String? ?? '',
      tipoVacuna: data?['tipo_vacuna'] as String?,
      fechaAplicacion: data?['fecha_aplicacion'] as String?,
      proximaDosis: data?['proxima_dosis'] as String?,
      observaciones: data?['observaciones'] as String?,
      createdAt: data?['created_at'] as String?,
      updatedAt: data?['updated_at'] as String?,
    );
  }

  final String id;
  final String usuarioId;
  final String animalId;
  final String? tipoVacuna;
  final String? fechaAplicacion;
  final String? proximaDosis;
  final String? observaciones;
  final String? createdAt;
  final String? updatedAt;

  Map<String, dynamic> toMap() {
    return {
      'usuario_id': usuarioId,
      'animal_id': animalId,
      'tipo_vacuna': tipoVacuna,
      'fecha_aplicacion': fechaAplicacion,
      'proxima_dosis': proximaDosis,
      'observaciones': observaciones,
      'created_at': createdAt,
      'updated_at': updatedAt,
    }..removeWhere((key, value) => value == null);
  }
}
