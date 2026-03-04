import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(
    firestore: ref.watch(firestoreProvider),
  );
});

class DashboardRepository {
  DashboardRepository({required FirebaseFirestore firestore})
      : _firestore = firestore;

  final FirebaseFirestore _firestore;

  Stream<int> animalsCount(String userId) {
    return _firestore
        .collection('animales')
        .where('usuario_id', isEqualTo: userId)
        .snapshots()
        .map((snap) => snap.size);
  }

  Stream<int> vaccinationsCount(String userId) {
    return _firestore
        .collection('vacunaciones')
        .where('usuario_id', isEqualTo: userId)
        .snapshots()
        .map((snap) => snap.size);
  }

  Stream<int> weightsCount(String userId) {
    return _firestore
        .collection('pesos')
        .where('usuario_id', isEqualTo: userId)
        .snapshots()
        .map((snap) => snap.size);
  }

  Stream<int> marketplaceListingsCount(String userId) {
    return _firestore
        .collection('animales')
        .where('usuario_id', isEqualTo: userId)
        .where('en_venta', isEqualTo: true)
        .snapshots()
        .map((snap) => snap.size);
  }
}
