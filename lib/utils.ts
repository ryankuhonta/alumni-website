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

export interface Province {
  name: string
  cities: string[]
}

export const LOCATION_DATA: Province[] = [
  {
    name: 'Laguna',
    cities: [
      'San Pedro',
      'Biñan',
      'Santa Rosa',
      'Cabuyao',
      'Calamba',
      'Los Baños',
      'Sta. Cruz',
      'Victoria',
      'Nagcarlan',
      'Pagsanjan',
      'Lumban',
      'Kalayaan',
      'Canlubang',
      'Bay',
      'Calauan',
      'Alaminos',
      'San Pablo',
      'San Pedro',
      'Talim Island',
    ],
  },
  {
    name: 'Batangas',
    cities: [
      'Batangas City',
      'Lipa',
      'Tanauan',
      'Santo Tomas',
      'Malvar',
      'Taal',
      'Nasugbu',
      'Calatagan',
      'Balayan',
      'Lemery',
    ],
  },
  {
    name: 'Cavite',
    cities: [
      'Imus',
      'Dasmariñas',
      'Bacoor',
      'General Trias',
      'Trece Martires',
      'Tagaytay',
      'Silang',
      'Amadeo',
      'Kawit',
      'Noveleta',
      'Rosario',
    ],
  },
  {
    name: 'NCR',
    cities: [
      'Manila',
      'Makati',
      'Pasig',
      'Taguig (BGC)',
      'Quezon City',
      'Caloocan',
      'Parañaque',
      'Las Piñas',
      'Muntinlupa',
      'Pasay',
      'Mandaluyong',
      'San Juan',
      'Marikina',
      'Malabon',
      'Navotas',
      'Valenzuela',
    ],
  },
  {
    name: 'Pampanga',
    cities: [
      'Angeles City',
      'San Fernando',
      'Mabalacat',
      'Guagua',
      'Lubao',
    ],
  },
  {
    name: 'Bulacan',
    cities: [
      'San Jose del Monte',
      'Meycauayan',
      'Marilao',
      'Bocaue',
      'Balagtas',
      'Guiguinto',
    ],
  },
  {
    name: 'Rizal',
    cities: [
      'Antipolo',
      'Taytay',
      'Cainta',
      'Binangonan',
      'Angono',
      'Cardona',
    ],
  },
  {
    name: 'Other Province',
    cities: [],
  },
  {
    name: 'Overseas',
    cities: [],
  },
]

export const PROVINCE_NAMES = LOCATION_DATA.map(p => p.name)

export function getProvinceByName(name: string): Province | undefined {
  return LOCATION_DATA.find(p => p.name === name)
}

export function formatLocation(province: string, city: string): string {
  if (!province) return ''
  if (!city || city === 'Other') return province
  return `${city}, ${province}`
}

export function parseLocation(location: string): { province: string; city: string } {
  if (!location) return { province: '', city: '' }

  // Check for "City, Province" format
  const parts = location.split(', ').map(s => s.trim())
  if (parts.length === 2) {
    // Find matching province
    const matchedProvince = LOCATION_DATA.find(p =>
      p.name.toLowerCase() === parts[1].toLowerCase() ||
      p.name.toLowerCase().includes(parts[1].toLowerCase())
    )
    if (matchedProvince) {
      // Check if the city matches
      const matchedCity = matchedProvince.cities.find(c =>
        c.toLowerCase() === parts[0].toLowerCase()
      )
      if (matchedCity) {
        return { province: matchedProvince.name, city: matchedCity }
      }
      // City doesn't match exactly, might be "Other"
      return { province: matchedProvince.name, city: parts[0] }
    }
  }

  // Check if it's just a province name (e.g., "Pampanga", "Overseas")
  const matchedProvince = LOCATION_DATA.find(p =>
    p.name.toLowerCase() === location.toLowerCase()
  )
  if (matchedProvince) {
    return { province: matchedProvince.name, city: '' }
  }

  // Check for "NCR - City" format
  if (location.startsWith('NCR')) {
    const city = location.replace('NCR - ', '').replace('NCR', '').trim()
    return { province: 'NCR', city: city || '' }
  }

  // Fallback - treat entire string as custom city under "Other Province"
  return { province: 'Other Province', city: location }
}
