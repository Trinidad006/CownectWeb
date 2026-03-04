import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return _webOptions;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return _androidOptions;
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

  static FirebaseOptions get _androidOptions {
    final options = _optionsFromEnvironment();
    return options;
  }

  static FirebaseOptions get _webOptions {
    final options = _optionsFromEnvironment();
    return options;
  }

  static FirebaseOptions _optionsFromEnvironment() {
    const apiKey =
        String.fromEnvironment('FIREBASE_API_KEY', defaultValue: 'REPLACE_ME');
    const appId =
        String.fromEnvironment('FIREBASE_APP_ID', defaultValue: 'REPLACE_ME');
    const messagingSenderId = String.fromEnvironment(
      'FIREBASE_MESSAGING_SENDER_ID',
      defaultValue: 'REPLACE_ME',
    );
    const projectId = String.fromEnvironment(
      'FIREBASE_PROJECT_ID',
      defaultValue: 'REPLACE_ME',
    );
    const storageBucket = String.fromEnvironment(
      'FIREBASE_STORAGE_BUCKET',
      defaultValue: 'REPLACE_ME',
    );

    if (apiKey == 'REPLACE_ME' ||
        appId == 'REPLACE_ME' ||
        messagingSenderId == 'REPLACE_ME' ||
        projectId == 'REPLACE_ME' ||
        storageBucket == 'REPLACE_ME') {
      throw UnsupportedError(
        'Configura las variables --dart-define para Firebase (FIREBASE_API_KEY, FIREBASE_APP_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET) o genera firebase_options.dart con flutterfire configure.',
      );
    }

    return FirebaseOptions(
      apiKey: apiKey,
      appId: appId,
      messagingSenderId: messagingSenderId,
      projectId: projectId,
      storageBucket: storageBucket,
    );
  }
}
