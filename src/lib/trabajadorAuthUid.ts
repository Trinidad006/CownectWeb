/** UID de Firebase Auth para sesión de trabajador (único por dueño + doc trabajador). */
export function buildTrabajadorAuthUid(ownerUid: string, trabajadorDocId: string): string {
  return `trabajador_${ownerUid}_${trabajadorDocId}`
}
