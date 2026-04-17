import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../core/constants.dart';
import '../../../core/providers.dart';
import '../domain/animal_certificate.dart';

final animalCertificatesRepositoryProvider =
    Provider<AnimalCertificatesRepository>((ref) {
  return AnimalCertificatesRepository(
    client: ref.watch(httpClientProvider),
    firestore: ref.watch(firestoreProvider),
    baseUrl: AppConstants.apiBaseUrl,
  );
});

class AnimalCertificatesRepository {
  AnimalCertificatesRepository({
    required this.client,
    required this.firestore,
    required this.baseUrl,
  });

  final http.Client client;
  final FirebaseFirestore firestore;
  final String baseUrl;

  static const _certificatesCollection = 'animal_certificates';

  Uri _endpoint(String path) => Uri.parse('$baseUrl$path');

  Future<List<AnimalCertificate>> getByAnimal(String animalId) async {
    final snapshot = await firestore
        .collection(_certificatesCollection)
        .where('animal_id', isEqualTo: animalId)
        .get();
    final list = snapshot.docs
        .map((doc) => AnimalCertificate.fromJson(_documentToCertificateJson(doc)))
        .toList(growable: false);
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  Map<String, dynamic> _documentToCertificateJson(
    QueryDocumentSnapshot<Map<String, dynamic>> doc,
  ) {
    final data = Map<String, dynamic>.from(doc.data());
    data['id'] = doc.id;
    for (final key in ['created_at', 'updated_at']) {
      final v = data[key];
      if (v is Timestamp) {
        data[key] = v.toDate().toIso8601String();
      } else if (v is DateTime) {
        data[key] = v.toIso8601String();
      }
    }
    return data;
  }

  Future<Map<String, dynamic>> createAutomatic({
    required String userId,
    required String animalId,
  }) async {
    final response = await client.post(
      _endpoint('/api/animal-certificates'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'userId': userId, 'animalId': animalId, 'auto': true}),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw _httpError(response);
  }

  Future<void> adminValidate({
    required String animalId,
    required String adminPassword,
  }) async {
    final response = await client.post(
      _endpoint('/api/animal-certificates/admin-validate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'animalId': animalId, 'adminPassword': adminPassword}),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) return;
    throw _httpError(response);
  }

  Future<Map<String, dynamic>> markReviewedWithTxHash({
    required String animalId,
    required String adminPassword,
    required String txHash,
  }) async {
    final response = await client.post(
      _endpoint('/api/animal-certificates/mark-reviewed'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'animalId': animalId,
        'adminPassword': adminPassword,
        'txHash': txHash,
      }),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw _httpError(response);
  }

  Exception _httpError(http.Response response) {
    try {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final message = data['error'] ?? data['message'] ?? response.body;
      return Exception(message.toString());
    } catch (_) {
      return Exception(
        'Error (${response.statusCode}): ${response.reasonPhrase ?? 'Solicitud fallida'}',
      );
    }
  }
}
