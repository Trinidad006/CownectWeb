import 'package:cloud_firestore/cloud_firestore.dart';

enum BuyRequestStatus { pending, accepted, rejected, cancelled, completed }

BuyRequestStatus buyRequestStatusFromString(String value) {
  switch (value) {
    case 'accepted':
      return BuyRequestStatus.accepted;
    case 'rejected':
      return BuyRequestStatus.rejected;
    case 'cancelled':
      return BuyRequestStatus.cancelled;
    case 'completed':
      return BuyRequestStatus.completed;
    case 'pending':
    default:
      return BuyRequestStatus.pending;
  }
}

String buyRequestStatusToString(BuyRequestStatus status) {
  return status.name;
}

class BuyRequest {
  BuyRequest({
    required this.id,
    required this.fromUserId,
    required this.toUserId,
    required this.mensajeInicial,
    required this.estado,
    this.animalIds,
    this.dealIdOnchain,
    this.createdAt,
    this.updatedAt,
  });

  factory BuyRequest.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    return BuyRequest(
      id: doc.id,
      fromUserId: data?['from_user_id'] as String? ?? '',
      toUserId: data?['to_user_id'] as String? ?? '',
      animalIds: (data?['animal_ids'] as List<dynamic>?)
          ?.whereType<String>()
          .toList(),
      mensajeInicial: data?['mensaje_inicial'] as String? ?? '',
      estado: buyRequestStatusFromString(
        data?['estado'] as String? ?? 'pending',
      ),
      dealIdOnchain: data?['deal_id_onchain'] as String?,
      createdAt: data?['created_at'] as String?,
      updatedAt: data?['updated_at'] as String?,
    );
  }

  final String id;
  final String fromUserId;
  final String toUserId;
  final List<String>? animalIds;
  final String mensajeInicial;
  final BuyRequestStatus estado;
  final String? dealIdOnchain;
  final String? createdAt;
  final String? updatedAt;

  Map<String, dynamic> toMap() {
    final map = <String, dynamic>{
      'from_user_id': fromUserId,
      'to_user_id': toUserId,
      'animal_ids': animalIds,
      'mensaje_inicial': mensajeInicial,
      'estado': buyRequestStatusToString(estado),
      'deal_id_onchain': dealIdOnchain,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
    map.removeWhere((key, value) => value == null);
    return map;
  }
}

