import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../core/constants.dart';
import '../../../core/providers.dart';

final marketplaceRepositoryProvider = Provider<MarketplaceRepository>((ref) {
  return MarketplaceRepository(
    client: ref.watch(httpClientProvider),
    baseUrl: AppConstants.apiBaseUrl,
  );
});

class MarketplaceRepository {
  MarketplaceRepository({
    required this.client,
    required this.baseUrl,
  });

  final http.Client client;
  final String baseUrl;

  Uri _endpoint(String path) => Uri.parse('$baseUrl$path');

  Future<String> createOrder({
    required double amount,
    required String currency,
    required String animalId,
    required String buyerId,
  }) async {
    final response = await client.post(
      _endpoint('/api/paypal/create-order'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'amount': amount,
        'currency': currency,
        'animalId': animalId,
        'compradorId': buyerId,
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['orderID'] as String;
    }
    throw _httpError(response);
  }

  Future<void> captureOrder(String orderId) async {
    final response = await client.post(
      _endpoint('/api/paypal/capture-order'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'orderID': orderId}),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
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
