export type RamaType = 'Mixto' | 'F' | 'M';

export type EstadoPartido = 'Confirmado' | 'A Coordinar' | 'Condicional';

export interface Match {
  id: string;
  categoria: string;
  rama: RamaType | string;
  local: string;
  visitante: string;
  fecha: string; // DD/MM/YYYY
  hora: string;  // HH:MM
  observCancha: string;
  observaciones: string;
  esCondicional: boolean;
  estado: EstadoPartido;
  canchaAsignada?: string;
  entrenador?: string;
  entrenadorTel?: string;
  padresGrupo?: string;
  direccionSede?: string;
  citacionMinutos?: number;
}

export interface ClubContact {
  id: string;
  nombre: string;
  delegado: string;
  email: string;
  telefono: string;
  canchaDireccion: string;
  colorCamiseta: string;
}

export interface Coach {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  categorias: string[];
  rol: string;
}
