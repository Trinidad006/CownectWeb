class AnimalCertificate {
  AnimalCertificate({
    required this.id,
    required this.animalId,
    required this.usuarioId,
    this.ownerWallet,
    required this.certificateIdOnchain,
    this.cownectCertificateId,
    required this.metadataUri,
    this.txHash,
    required this.createdAt,
  });

  factory AnimalCertificate.fromJson(Map<String, dynamic> json) {
    return AnimalCertificate(
      id: (json['id'] ?? '').toString(),
      animalId: (json['animal_id'] ?? '').toString(),
      usuarioId: (json['usuario_id'] ?? '').toString(),
      ownerWallet: json['owner_wallet']?.toString(),
      certificateIdOnchain: (json['certificate_id_onchain'] ?? '').toString(),
      cownectCertificateId: (json['cownect_certificate_id'] as num?)?.toInt(),
      metadataUri: (json['metadata_uri'] ?? '').toString(),
      txHash: json['tx_hash']?.toString(),
      createdAt: (json['created_at'] ?? '').toString(),
    );
  }

  final String id;
  final String animalId;
  final String usuarioId;
  final String? ownerWallet;
  final String certificateIdOnchain;
  final int? cownectCertificateId;
  final String metadataUri;
  final String? txHash;
  final String createdAt;
}
