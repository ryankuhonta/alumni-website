export function toTitleCase(str: string): string {
  if (!str) return str
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle special cases like "Mc", "De", "Del", "Van", "Mac"
      if (word.length <= 2 && word !== 'i') return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export const PREDEFINED_LOCATIONS = [
  'San Pedro, Laguna',
  'Biñan, Laguna',
  'Santa Rosa, Laguna',
  'Cabuyao, Laguna',
  'Calamba, Laguna',
  'Los Baños, Laguna',
  'Sta. Cruz, Laguna',
  'Victoria, Laguna',
  'Nagcarlan, Laguna',
  'Pagsanjan, Laguna',
  'Lumban, Laguna',
  'Kalahati, Laguna',
  'Binan, Laguna',
  'Canlubang, Laguna',
  'Batangas City',
  'Lipa, Batangas',
  'Tanauan, Batangas',
  'NCR - Manila',
  'NCR - Makati',
  'NCR - Pasig',
  'NCR - Taguig',
  'NCR - BGC',
  'NCR - Quezon City',
  'NCR - Caloocan',
  'NCR - Parañaque',
  'NCR - Las Piñas',
  'NCR - Muntinlupa',
  'NCR - Pasay',
  'NCR - Malabon',
  'NCR - Navotas',
  'NCR - Valenzuela',
  'NCR - Marikina',
  'NCR - Mandaluyong',
  'NCR - San Juan',
  'Pampanga',
  'Bulacan',
  'Cavite',
  'Rizal',
  'Laguna (Other)',
  'Overseas',
  'Other',
]
