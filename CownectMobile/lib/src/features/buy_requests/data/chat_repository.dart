import 'package:cloud_firestore/cloud_firestore.dart';

import '../domain/chat_message.dart';

class ChatRepository {
  ChatRepository(this._firestore);

  final FirebaseFirestore _firestore;

  static const String collectionName = 'chat_messages';

  CollectionReference<Map<String, dynamic>> get _collection =>
      _firestore.collection(collectionName);

  Future<String> sendMessage({
    required String chatId,
    required String authorId,
    required String texto,
    List<String>? attachmentUrls,
  }) async {
    final now = DateTime.now().toIso8601String();
    final data = <String, dynamic>{
      'chat_id': chatId,
      'author_id': authorId,
      'texto': texto,
      'attachment_urls': attachmentUrls,
      'created_at': now,
    }..removeWhere((key, value) => value == null);

    final ref = await _collection.add(data);
    return ref.id;
  }

  Stream<List<ChatMessage>> watchChat(String chatId) {
    final query = _collection
        .where('chat_id', isEqualTo: chatId)
        .orderBy('created_at', descending: false);

    return query.snapshots().map(
          (snapshot) =>
              snapshot.docs.map(ChatMessage.fromDocument).toList(growable: false),
        );
  }
}

