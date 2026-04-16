import 'package:cloud_firestore/cloud_firestore.dart';

class ChatMessage {
  ChatMessage({
    required this.id,
    required this.chatId,
    required this.authorId,
    required this.texto,
    this.attachmentUrls,
    this.createdAt,
  });

  factory ChatMessage.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    return ChatMessage(
      id: doc.id,
      chatId: data?['chat_id'] as String? ?? '',
      authorId: data?['author_id'] as String? ?? '',
      texto: data?['texto'] as String? ?? '',
      attachmentUrls: (data?['attachment_urls'] as List<dynamic>?)
          ?.whereType<String>()
          .toList(),
      createdAt: data?['created_at'] as String?,
    );
  }

  final String id;
  final String chatId;
  final String authorId;
  final String texto;
  final List<String>? attachmentUrls;
  final String? createdAt;

  Map<String, dynamic> toMap() {
    final map = <String, dynamic>{
      'chat_id': chatId,
      'author_id': authorId,
      'texto': texto,
      'attachment_urls': attachmentUrls,
      'created_at': createdAt,
    };
    map.removeWhere((key, value) => value == null);
    return map;
  }
}

