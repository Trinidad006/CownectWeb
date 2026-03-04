import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../../../core/constants.dart';
import '../../../core/providers.dart';
import '../domain/app_user.dart';

class AuthRepository {
  AuthRepository({
    required FirebaseAuth auth,
    required FirebaseFirestore firestore,
  })  : _auth = auth,
        _firestore = firestore;

  final FirebaseAuth _auth;
  final FirebaseFirestore _firestore;

  static const String usuariosCollection = 'usuarios';

  Stream<User?> authStateChanges() => _auth.authStateChanges();

  Stream<AppUser?> watchUserProfile(String uid) {
    return _firestore.collection(usuariosCollection).doc(uid).snapshots().map(
      (doc) {
        if (!doc.exists) return null;
        return AppUser.fromDocument(doc);
      },
    );
  }

  Future<AppUser?> fetchUserProfile(String uid) async {
    final doc = await _firestore.collection(usuariosCollection).doc(uid).get();
    if (!doc.exists) return null;
    return AppUser.fromDocument(doc);
  }

  Future<void> signOut() => _auth.signOut();

  Future<void> sendPasswordReset(String email) {
    return _auth.sendPasswordResetEmail(email: email);
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    final credential = await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    if (!(credential.user?.emailVerified ?? false)) {
      await _auth.signOut();
      throw const AuthException('Debes verificar tu correo antes de ingresar.');
    }
  }

  Future<void> register(RegisterRequest request) async {
    final credential = await _auth.createUserWithEmailAndPassword(
      email: request.email.trim(),
      password: request.password,
    );

    final user = credential.user;
    if (user == null) {
      throw const AuthException('No se pudo crear la cuenta.');
    }

    final now = DateTime.now().toIso8601String();
    final profile = {
      'email': request.email.trim(),
      'nombre': request.nombre,
      'apellido': request.apellido,
      'telefono': request.telefono,
      'rancho': request.rancho,
      'rancho_hectareas': request.ranchoHectareas,
      'rancho_pais': request.ranchoPais,
      'rancho_ciudad': request.ranchoCiudad,
      'rancho_direccion': request.ranchoDireccion,
      'rancho_descripcion': request.ranchoDescripcion,
      'moneda': request.moneda,
      'plan': 'gratuito',
      'suscripcion_activa': false,
      'created_at': now,
      'updated_at': now,
    }..removeWhere((key, value) => value == null);

    await _firestore.collection(usuariosCollection).doc(user.uid).set(profile);

    await user.updateDisplayName(
      [request.nombre, request.apellido].where((e) => e != null && e.isNotEmpty).join(' '),
    );

    try {
      await user.sendEmailVerification();
    } catch (error) {
      if (kDebugMode) {
        // ignore: avoid_print
        print('Error enviando verificación: $error');
      }
    }
  }

  Future<void> updateUserProfile(String uid, Map<String, dynamic> data) async {
    final payload = Map<String, dynamic>.from(data)
      ..removeWhere((key, value) => value == null);

    payload['updated_at'] = DateTime.now().toIso8601String();

    await _firestore.collection(usuariosCollection).doc(uid).update(payload);
  }

  Future<void> markPremium(String uid) async {
    await _firestore.collection(usuariosCollection).doc(uid).set({
      'plan': 'premium',
      'suscripcion_activa': true,
      'suscripcion_fecha': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }
}

class RegisterRequest {
  RegisterRequest({
    required this.email,
    required this.password,
    required this.nombre,
    required this.apellido,
    required this.rancho,
    this.telefono,
    this.ranchoHectareas,
    this.ranchoPais,
    this.ranchoCiudad,
    this.ranchoDireccion,
    this.ranchoDescripcion,
    this.moneda,
  });

  final String email;
  final String password;
  final String nombre;
  final String apellido;
  final String rancho;
  final String? telefono;
  final double? ranchoHectareas;
  final String? ranchoPais;
  final String? ranchoCiudad;
  final String? ranchoDireccion;
  final String? ranchoDescripcion;
  final String? moneda;
}

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}
