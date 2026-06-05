export enum TipoMaquina {
  TROQUELADORA = 'troqueladora',
  TALADRO = 'taladro',
  HORNO = 'horno',
  VULCANIZADORA = 'vulcanizadora',
  SOLDADURA = 'soldadura',
  PRENSA_HIDRAULICA = 'prensa_hidraulica',
  SOLDADURA_MIG = 'soldadura_mig',
  SOLDADURA_PUNTO = 'soldadura_punto',
  SELLADORA = 'selladora',
  AVELLANADORA = 'avellanadora',
}

export const TIPO_MAQUINA_LABELS: Record<TipoMaquina, string> = {
  [TipoMaquina.TROQUELADORA]: 'Troqueladora',
  [TipoMaquina.TALADRO]: 'Taladro',
  [TipoMaquina.HORNO]: 'Horno',
  [TipoMaquina.VULCANIZADORA]: 'Vulcanizadora',
  [TipoMaquina.SOLDADURA]: 'Soldadura',
  [TipoMaquina.PRENSA_HIDRAULICA]: 'Prensa Hidráulica',
  [TipoMaquina.SOLDADURA_MIG]: 'Soldadura MIG',
  [TipoMaquina.SOLDADURA_PUNTO]: 'Soldadura punto',
  [TipoMaquina.SELLADORA]: 'Selladora',
  [TipoMaquina.AVELLANADORA]: 'Avellanadora',
}

export const TIPOS_MAQUINA = Object.values(TipoMaquina).map((value) => ({
  value,
  label: TIPO_MAQUINA_LABELS[value],
}))
