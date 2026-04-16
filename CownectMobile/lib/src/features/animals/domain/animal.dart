import 'package:cloud_firestore/cloud_firestore.dart';

class Animal {
  Animal({
    required this.id,
    required this.usuarioId,
    this.nombre,
    this.numeroIdentificacion,
    this.especie,
    this.raza,
    this.fechaNacimiento,
    this.sexo,
    this.enVenta = false,
    this.precioVenta,
    this.estadoVenta,
    this.foto,
    this.revisadoParaVenta = false,
    this.documentosCompletos = false,
    this.estadoDocumentacion,
    this.documentoGuiaTransito,
    this.documentoFacturaVenta,
    this.documentoCertificadoMovilizacion,
    this.documentoPatenteFierro,
    this.createdAt,
    this.updatedAt,
  });

  factory Animal.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    return Animal(
      id: doc.id,
      usuarioId: data?['usuario_id'] as String? ?? '',
      nombre: data?['nombre'] as String?,
      numeroIdentificacion: data?['numero_identificacion'] as String?,
      especie: data?['especie'] as String?,
      raza: data?['raza'] as String?,
      fechaNacimiento: data?['fecha_nacimiento'] as String?,
      sexo: data?['sexo'] as String?,
      enVenta: data?['en_venta'] as bool? ?? false,
      precioVenta: (data?['precio_venta'] as num?)?.toDouble(),
      estadoVenta: data?['estado_venta'] as String?,
      foto: data?['foto'] as String?,
      revisadoParaVenta: data?['revisado_para_venta'] as bool? ?? false,
      documentosCompletos: data?['documentos_completos'] as bool? ?? false,
      estadoDocumentacion: data?['estado_documentacion'] as String?,
      documentoGuiaTransito: data?['documento_guia_transito'] as String?,
      documentoFacturaVenta: data?['documento_factura_venta'] as String?,
      documentoCertificadoMovilizacion:
          data?['documento_certificado_movilizacion'] as String?,
      documentoPatenteFierro: data?['documento_patente_fierro'] as String?,
      createdAt: data?['created_at'] as String?,
      updatedAt: data?['updated_at'] as String?,
    );
  }

  final String id;
  final String usuarioId;
  final String? nombre;
  final String? numeroIdentificacion;
  final String? especie;
  final String? raza;
  final String? fechaNacimiento;
  final String? sexo;
  final bool enVenta;
  final double? precioVenta;
  final String? estadoVenta;
  final String? foto;
  final bool revisadoParaVenta;
  final bool documentosCompletos;
  final String? estadoDocumentacion;
  final String? documentoGuiaTransito;
  final String? documentoFacturaVenta;
  final String? documentoCertificadoMovilizacion;
  final String? documentoPatenteFierro;
  final String? createdAt;
  final String? updatedAt;

  Animal copyWith({
    String? nombre,
    String? numeroIdentificacion,
    String? especie,
    String? raza,
    String? fechaNacimiento,
    String? sexo,
    bool? enVenta,
    double? precioVenta,
    String? estadoVenta,
    String? foto,
    bool? revisadoParaVenta,
    bool? documentosCompletos,
    String? estadoDocumentacion,
    String? documentoGuiaTransito,
    String? documentoFacturaVenta,
    String? documentoCertificadoMovilizacion,
    String? documentoPatenteFierro,
  }) {
    return Animal(
      id: id,
      usuarioId: usuarioId,
      nombre: nombre ?? this.nombre,
      numeroIdentificacion: numeroIdentificacion ?? this.numeroIdentificacion,
      especie: especie ?? this.especie,
      raza: raza ?? this.raza,
      fechaNacimiento: fechaNacimiento ?? this.fechaNacimiento,
      sexo: sexo ?? this.sexo,
      enVenta: enVenta ?? this.enVenta,
      precioVenta: precioVenta ?? this.precioVenta,
      estadoVenta: estadoVenta ?? this.estadoVenta,
      foto: foto ?? this.foto,
      revisadoParaVenta: revisadoParaVenta ?? this.revisadoParaVenta,
      documentosCompletos: documentosCompletos ?? this.documentosCompletos,
      estadoDocumentacion: estadoDocumentacion ?? this.estadoDocumentacion,
      documentoGuiaTransito:
          documentoGuiaTransito ?? this.documentoGuiaTransito,
      documentoFacturaVenta:
          documentoFacturaVenta ?? this.documentoFacturaVenta,
      documentoCertificadoMovilizacion:
          documentoCertificadoMovilizacion ??
          this.documentoCertificadoMovilizacion,
      documentoPatenteFierro:
          documentoPatenteFierro ?? this.documentoPatenteFierro,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'usuario_id': usuarioId,
      'nombre': nombre,
      'numero_identificacion': numeroIdentificacion,
      'especie': especie,
      'raza': raza,
      'fecha_nacimiento': fechaNacimiento,
      'sexo': sexo,
      'en_venta': enVenta,
      'precio_venta': precioVenta,
      'estado_venta': estadoVenta,
      'foto': foto,
      'revisado_para_venta': revisadoParaVenta,
      'documentos_completos': documentosCompletos,
      'estado_documentacion': estadoDocumentacion,
      'documento_guia_transito': documentoGuiaTransito,
      'documento_factura_venta': documentoFacturaVenta,
      'documento_certificado_movilizacion': documentoCertificadoMovilizacion,
      'documento_patente_fierro': documentoPatenteFierro,
      'created_at': createdAt,
      'updated_at': updatedAt,
    }..removeWhere((key, value) => value == null);
  }
}

class AnimalCreateRequest {
  AnimalCreateRequest({
    required this.usuarioId,
    this.nombre,
    this.numeroIdentificacion,
    this.especie,
    this.raza,
    this.fechaNacimiento,
    this.sexo,
    this.enVenta = false,
    this.precioVenta,
    this.foto,
  });

  final String usuarioId;
  final String? nombre;
  final String? numeroIdentificacion;
  final String? especie;
  final String? raza;
  final String? fechaNacimiento;
  final String? sexo;
  final bool enVenta;
  final double? precioVenta;
  final String? foto;

  Map<String, dynamic> toMap() {
    final now = DateTime.now().toIso8601String();
    return {
      'usuario_id': usuarioId,
      'nombre': nombre,
      'numero_identificacion': numeroIdentificacion,
      'especie': especie,
      'raza': raza,
      'fecha_nacimiento': fechaNacimiento,
      'sexo': sexo,
      'en_venta': enVenta,
      'precio_venta': precioVenta,
      'estado_venta': enVenta ? 'en_venta' : 'no_disponible',
      'foto': foto,
      'created_at': now,
      'updated_at': now,
    }..removeWhere((key, value) => value == null);
  }
}
