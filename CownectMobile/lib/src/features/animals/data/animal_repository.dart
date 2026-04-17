import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;

import '../../../core/providers.dart';
import '../domain/animal.dart';

final animalRepositoryProvider = Provider<AnimalRepository>((ref) {
  return AnimalRepository(
    firestore: ref.watch(firestoreProvider),
    storage: ref.watch(firebaseStorageProvider),
  );
});

class AnimalRepository {
  AnimalRepository({
    required FirebaseFirestore firestore,
    required FirebaseStorage storage,
  }) : _firestore = firestore,
       _storage = storage;

  final FirebaseFirestore _firestore;
  final FirebaseStorage _storage;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('animales');

  Stream<List<Animal>> watchAnimals(String userId) {
    return _collection
        .where('usuario_id', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
          final list = snapshot.docs
              .map((doc) => Animal.fromDocument(doc))
              .toList(growable: false);
          list.sort((a, b) {
            final ca = a.createdAt ?? '';
            final cb = b.createdAt ?? '';
            return cb.compareTo(ca);
          });
          return list;
        });
  }

  Stream<Animal?> watchAnimalById(String animalId) {
    return _collection.doc(animalId).snapshots().map((doc) {
      if (!doc.exists) return null;
      return Animal.fromDocument(doc);
    });
  }

  Future<Animal> addAnimal(AnimalCreateRequest request) async {
    final doc = await _collection.add(request.toMap());
    final snapshot = await doc.get();
    return Animal.fromDocument(snapshot);
  }

  Future<void> updateAnimal(String id, Map<String, dynamic> data) {
    final payload = Map<String, dynamic>.from(data)
      ..removeWhere((key, value) => value == null)
      ..['updated_at'] = DateTime.now().toIso8601String();
    return _collection.doc(id).update(payload);
  }

  Future<void> deleteAnimal(String id) async {
    await _collection.doc(id).delete();
  }

  Stream<List<Animal>> watchMarketplace({String? excludeUserId}) {
    return _collection
        .where('en_venta', isEqualTo: true)
        .snapshots()
        .map(
          (snapshot) => snapshot.docs
              .map((doc) => Animal.fromDocument(doc))
              .where(
                (animal) =>
                    excludeUserId == null || animal.usuarioId != excludeUserId,
              )
              .toList(growable: false),
        );
  }

  Future<String> uploadAnimalPhoto({
    required File file,
    required String userId,
    required String animalId,
  }) async {
    final fileName = p.basename(file.path);
    final ref = _storage
        .ref()
        .child('usuarios')
        .child(userId)
        .child('animales')
        .child(animalId)
        .child(fileName);
    final uploadTask = await ref.putFile(file);
    return uploadTask.ref.getDownloadURL();
  }
}
