import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../domain/weight_record.dart';

final weightRepositoryProvider = Provider<WeightRepository>((ref) {
  return WeightRepository(
    firestore: ref.watch(firestoreProvider),
  );
});

class WeightRepository {
  WeightRepository({required FirebaseFirestore firestore})
      : _firestore = firestore;

  final FirebaseFirestore _firestore;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('pesos');

  Stream<List<WeightRecord>> watchWeights(String userId) {
    return _collection
        .where('usuario_id', isEqualTo: userId)
        .orderBy('fecha_registro', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => WeightRecord.fromDocument(doc))
            .toList(growable: false));
  }

  Future<void> addWeight(WeightRecord record) {
    final data = record.toMap()
      ..['created_at'] = DateTime.now().toIso8601String()
      ..['updated_at'] = DateTime.now().toIso8601String();
    return _collection.add(data);
  }

  Future<void> deleteWeight(String id) => _collection.doc(id).delete();
}
