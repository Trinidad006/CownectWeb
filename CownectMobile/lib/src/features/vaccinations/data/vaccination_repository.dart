import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../domain/vaccination.dart';

final vaccinationRepositoryProvider = Provider<VaccinationRepository>((ref) {
  return VaccinationRepository(
    firestore: ref.watch(firestoreProvider),
  );
});

class VaccinationRepository {
  VaccinationRepository({required FirebaseFirestore firestore})
      : _firestore = firestore;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('vacunaciones');

  Stream<List<Vaccination>> watchVaccinations(String userId) {
    return _collection
        .where('usuario_id', isEqualTo: userId)
        .orderBy('fecha_aplicacion', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Vaccination.fromDocument(doc))
            .toList(growable: false));
  }

  Future<void> addVaccination(Vaccination vaccination) {
    final data = vaccination.toMap()
      ..['created_at'] = DateTime.now().toIso8601String()
      ..['updated_at'] = DateTime.now().toIso8601String();
    return _collection.add(data);
  }

  Future<void> deleteVaccination(String id) => _collection.doc(id).delete();
}
