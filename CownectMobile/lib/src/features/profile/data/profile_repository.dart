import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;

import '../../../core/providers.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(
    firestore: ref.watch(firestoreProvider),
    storage: ref.watch(firebaseStorageProvider),
  );
});

class ProfileRepository {
  ProfileRepository({
    required FirebaseFirestore firestore,
    required FirebaseStorage storage,
  })  : _firestore = firestore,
        _storage = storage;

  final FirebaseFirestore _firestore;
  final FirebaseStorage _storage;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection('usuarios');

  Future<void> updateProfile(String uid, Map<String, dynamic> data) async {
    final payload = Map<String, dynamic>.from(data)
      ..removeWhere((key, value) => value == null)
      ..['updated_at'] = DateTime.now().toIso8601String();
    await _collection.doc(uid).update(payload);
  }

  Future<String> uploadProfilePhoto(String uid, File file) async {
    final fileName = p.basename(file.path);
    final ref = _storage.ref().child('usuarios').child(uid).child('perfil').child(fileName);
    final uploadTask = await ref.putFile(file);
    return uploadTask.ref.getDownloadURL();
  }
}
