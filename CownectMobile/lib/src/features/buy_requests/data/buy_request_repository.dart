import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/buy_request.dart';

class BuyRequestRepository {
  BuyRequestRepository(this._firestore);

  final FirebaseFirestore _firestore;

  static const String collectionName = 'buy_requests';

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection(collectionName);

  Future<String> create({
    required String fromUserId,
    required String toUserId,
    required String mensajeInicial,
    List<String>? animalIds,
  }) async {
    final now = DateTime.now().toIso8601String();
    final data = <String, dynamic>{
      'from_user_id': fromUserId,
      'to_user_id': toUserId,
      'animal_ids': animalIds,
      'mensaje_inicial': mensajeInicial,
      'estado': 'pending',
      'deal_id_onchain': null,
      'created_at': now,
      'updated_at': now,
    }..removeWhere((key, value) => value == null);

    final ref = await _collection.add(data);
    return ref.id;
  }

  Stream<List<BuyRequest>> watchForUser(String userId) {
    final query = _collection
        .where('to_user_id', isEqualTo: userId)
        .orderBy('created_at', descending: true);

    return query.snapshots().map(
          (snapshot) =>
              snapshot.docs.map(BuyRequest.fromDocument).toList(growable: false),
        );
  }
}

