import 'package:cloud_firestore/cloud_firestore.dart';

class WeightRecord {
  WeightRecord({
    required this.id,
    required this.usuarioId,
    required this.animalId,
    this.peso,
    this.fechaRegistro,
    this.observaciones,
    this.createdAt,
    this.updatedAt,
  });

  factory WeightRecord.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    return WeightRecord(
      id: doc.id,
      usuarioId: data?['usuario_id'] as String? ?? '',
      animalId: data?['animal_id'] as String? ?? '',
      peso: (data?['peso'] as num?)?.toDouble(),
      fechaRegistro: data?['fecha_registro'] as String?,
      observaciones: data?['observaciones'] as String?,
      createdAt: data?['created_at'] as String?,
      updatedAt: data?['updated_at'] as String?,
    );
  }

  final String id;
  final String usuarioId;
  final String animalId;
  final double? peso;
  final String? fechaRegistro;
  final String? observaciones;
  final String? createdAt;
  final String? updatedAt;

  Map<String, dynamic> toMap() {
    return {
      'usuario_id': usuarioId,
      'animal_id': animalId,
      'peso': peso,
      'fecha_registro': fechaRegistro,
      'observaciones': observaciones,
      'created_at': createdAt,
      'updated_at': updatedAt,
    }..removeWhere((key, value) => value == null);
  }
}
