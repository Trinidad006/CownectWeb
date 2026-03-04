import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Configuración fija de Firebase para Cownect,
/// utilizando el mismo proyecto que la web (`cownect-6956b`).
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'Configura Firebase para iOS o ajusta DefaultFirebaseOptions.',
        );
      default:
        throw UnsupportedError(
          'Plataforma ${defaultTargetPlatform.name} aún no soportada.',
        );
    }
  }

  /// Opciones para Android (appId tomado del proyecto Firebase Android).
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAh8ZJJCC3mUX18nx__5MdmdVOnLkQURpY',
    appId: '1:694518951456:android:4fddbe5589f64e6eb91645',
    messagingSenderId: '694518951456',
    projectId: 'cownect-6956b',
    storageBucket: 'cownect-6956b.firebasestorage.app',
  );

  /// Opciones para Web (los mismos valores que usa CownectWeb).
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyAh8ZJJCC3mUX18nx__5MdmdVOnLkQURpY',
    appId: '1:694518951456:web:4fddbe5589f64e6eb91645',
    messagingSenderId: '694518951456',
    projectId: 'cownect-6956b',
    storageBucket: 'cownect-6956b.firebasestorage.app',
  );
}
