import 'package:cloud_firestore/cloud_firestore.dart';

class AppUser {
  AppUser({
    required this.id,
    required this.email,
    this.nombre,
    this.apellido,
    this.telefono,
    this.rancho,
    this.ranchoHectareas,
    this.ranchoPais,
    this.ranchoCiudad,
    this.ranchoDireccion,
    this.ranchoDescripcion,
    this.fotoPerfil,
    this.plan = UserPlan.free,
    this.suscripcionActiva = false,
    this.suscripcionFecha,
    this.createdAt,
    this.updatedAt,
  });

  factory AppUser.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data();
    return AppUser(
      id: doc.id,
      email: data?['email'] as String? ?? '',
      nombre: data?['nombre'] as String?,
      apellido: data?['apellido'] as String?,
      telefono: data?['telefono'] as String?,
      rancho: data?['rancho'] as String?,
      ranchoHectareas: (data?['rancho_hectareas'] as num?)?.toDouble(),
      ranchoPais: data?['rancho_pais'] as String?,
      ranchoCiudad: data?['rancho_ciudad'] as String?,
      ranchoDireccion: data?['rancho_direccion'] as String?,
      ranchoDescripcion: data?['rancho_descripcion'] as String?,
      fotoPerfil: data?['foto_perfil'] as String?,
      plan: _planFromString(data?['plan'] as String?),
      suscripcionActiva: data?['suscripcion_activa'] as bool? ?? false,
      suscripcionFecha: data?['suscripcion_fecha'] as String?,
      createdAt: data?['created_at'] as String?,
      updatedAt: data?['updated_at'] as String?,
    );
  }

  final String id;
  final String email;
  final String? nombre;
  final String? apellido;
  final String? telefono;
  final String? rancho;
  final double? ranchoHectareas;
  final String? ranchoPais;
  final String? ranchoCiudad;
  final String? ranchoDireccion;
  final String? ranchoDescripcion;
  final String? fotoPerfil;
  final UserPlan plan;
  final bool suscripcionActiva;
  final String? suscripcionFecha;
  final String? createdAt;
  final String? updatedAt;

  bool get isPremium => plan == UserPlan.premium || suscripcionActiva;

  AppUser copyWith({
    String? nombre,
    String? apellido,
    String? telefono,
    String? rancho,
    double? ranchoHectareas,
    String? ranchoPais,
    String? ranchoCiudad,
    String? ranchoDireccion,
    String? ranchoDescripcion,
    String? fotoPerfil,
    UserPlan? plan,
    bool? suscripcionActiva,
    String? suscripcionFecha,
  }) {
    return AppUser(
      id: id,
      email: email,
      nombre: nombre ?? this.nombre,
      apellido: apellido ?? this.apellido,
      telefono: telefono ?? this.telefono,
      rancho: rancho ?? this.rancho,
      ranchoHectareas: ranchoHectareas ?? this.ranchoHectareas,
      ranchoPais: ranchoPais ?? this.ranchoPais,
      ranchoCiudad: ranchoCiudad ?? this.ranchoCiudad,
      ranchoDireccion: ranchoDireccion ?? this.ranchoDireccion,
      ranchoDescripcion: ranchoDescripcion ?? this.ranchoDescripcion,
      fotoPerfil: fotoPerfil ?? this.fotoPerfil,
      plan: plan ?? this.plan,
      suscripcionActiva: suscripcionActiva ?? this.suscripcionActiva,
      suscripcionFecha: suscripcionFecha ?? this.suscripcionFecha,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  static UserPlan _planFromString(String? value) {
    if (value == 'premium') return UserPlan.premium;
    return UserPlan.free;
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'nombre': nombre,
      'apellido': apellido,
      'telefono': telefono,
      'rancho': rancho,
      'rancho_hectareas': ranchoHectareas,
      'rancho_pais': ranchoPais,
      'rancho_ciudad': ranchoCiudad,
      'rancho_direccion': ranchoDireccion,
      'rancho_descripcion': ranchoDescripcion,
      'foto_perfil': fotoPerfil,
      'plan': plan.name,
      'suscripcion_activa': suscripcionActiva,
      'suscripcion_fecha': suscripcionFecha,
      'created_at': createdAt,
      'updated_at': updatedAt,
    }..removeWhere((key, value) => value == null);
  }
}

enum UserPlan { free, premium }
