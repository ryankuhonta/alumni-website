export function toTitleCase(str: string): string {
  if (!str) return str
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length <= 2 && word !== 'i') return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export interface Province {
  name: string
  region: string
  cities: string[]
}

export const LOCATION_DATA: Province[] = [
  // Region I - Ilocos Region
  { name: 'Ilocos Norte', region: 'Ilocos', cities: ['Batac', 'Laoag'].sort() },
  { name: 'Ilocos Sur', region: 'Ilocos', cities: ['Candon', 'Vigan'].sort() },
  { name: 'La Union', region: 'Ilocos', cities: ['San Fernando'].sort() },
  { name: 'Pangasinan', region: 'Ilocos', cities: ['Dagupan', 'Lingayen', 'San Carlos', 'Urdaneta'].sort() },

  // Region II - Cagayan Valley
  { name: 'Batanes', region: 'Cagayan Valley', cities: ['Basco'].sort() },
  { name: 'Cagayan', region: 'Cagayan Valley', cities: ['Tuguegarao'].sort() },
  { name: 'Isabela', region: 'Cagayan Valley', cities: ['Cauayan', 'Ilagan', 'Santiago'].sort() },
  { name: 'Nueva Vizcaya', region: 'Cagayan Valley', cities: ['Bayombong'].sort() },
  { name: 'Quirino', region: 'Cagayan Valley', cities: ['Cabarroguis'].sort() },

  // Region III - Central Luzon
  { name: 'Aurora', region: 'Central Luzon', cities: ['Baler'].sort() },
  { name: 'Bataan', region: 'Central Luzon', cities: ['Balanga'].sort() },
  { name: 'Bulacan', region: 'Central Luzon', cities: ['Balagtas', 'Bocaue', 'Guiguinto', 'Marilao', 'Meycauayan', 'San Jose del Monte'].sort() },
  { name: 'Nueva Ecija', region: 'Central Luzon', cities: ['Cabanatuan', 'Gapan', 'San Jose'].sort() },
  { name: 'Pampanga', region: 'Central Luzon', cities: ['Angeles City', 'Guagua', 'Lubao', 'Mabalacat', 'San Fernando'].sort() },
  { name: 'Tarlac', region: 'Central Luzon', cities: ['Tarlac City'].sort() },
  { name: 'Zambales', region: 'Central Luzon', cities: ['Iba', 'Olongapo'].sort() },

  // Region IV-A - Calabarzon
  { name: 'Batangas', region: 'Calabarzon', cities: ['Balayan', 'Batangas City', 'Calatagan', 'Lemery', 'Lipa', 'Malvar', 'Nasugbu', 'Santo Tomas', 'Taal', 'Tanauan'].sort() },
  { name: 'Cavite', region: 'Calabarzon', cities: ['Amadeo', 'Bacoor', 'Dasmariñas', 'General Trias', 'Imus', 'Kawit', 'Noveleta', 'Rosario', 'Silang', 'Tagaytay', 'Trece Martires'].sort() },
  { name: 'Laguna', region: 'Calabarzon', cities: ['Alaminos', 'Bay', 'Biñan', 'Cabuyao', 'Calamba', 'Calauan', 'Kalayaan', 'Los Baños', 'Lumban', 'Nagcarlan', 'Pagsanjan', 'San Pablo', 'San Pedro', 'Sta. Cruz', 'Santa Rosa', 'Victoria'].sort() },
  { name: 'Quezon', region: 'Calabarzon', cities: ['Candelaria', 'Lucena', 'Sariaya', 'Tayabas'].sort() },
  { name: 'Rizal', region: 'Calabarzon', cities: ['Angono', 'Antipolo', 'Binangonan', 'Cainta', 'Cardona', 'Taytay'].sort() },

  // Region IV-B - Mimaropa
  { name: 'Marinduque', region: 'Mimaropa', cities: ['Boac'].sort() },
  { name: 'Occidental Mindoro', region: 'Mimaropa', cities: ['San Jose'].sort() },
  { name: 'Oriental Mindoro', region: 'Mimaropa', cities: ['Calapan'].sort() },
  { name: 'Palawan', region: 'Mimaropa', cities: ['Puerto Princesa'].sort() },
  { name: 'Romblon', region: 'Mimaropa', cities: ['Romblon'].sort() },

  // Region V - Bicol
  { name: 'Albay', region: 'Bicol', cities: ['Legazpi', 'Ligao', 'Tabaco'].sort() },
  { name: 'Camarines Norte', region: 'Bicol', cities: ['Daet'].sort() },
  { name: 'Camarines Sur', region: 'Bicol', cities: ['Iriga', 'Naga'].sort() },
  { name: 'Catanduanes', region: 'Bicol', cities: ['Virac'].sort() },
  { name: 'Masbate', region: 'Bicol', cities: ['Masbate City'].sort() },
  { name: 'Sorsogon', region: 'Bicol', cities: ['Sorsogon City'].sort() },

  // Region VI - Western Visayas
  { name: 'Aklan', region: 'Western Visayas', cities: ['Kalibo'].sort() },
  { name: 'Antique', region: 'Western Visayas', cities: ['San Jose de Buenavista'].sort() },
  { name: 'Capiz', region: 'Western Visayas', cities: ['Roxas'].sort() },
  { name: 'Guimaras', region: 'Western Visayas', cities: ['Jordan'].sort() },
  { name: 'Iloilo', region: 'Western Visayas', cities: ['Iloilo City', 'Passi'].sort() },
  { name: 'Negros Occidental', region: 'Western Visayas', cities: ['Bacolod', 'Silay', 'Talisay'].sort() },

  // Region VII - Central Visayas
  { name: 'Bohol', region: 'Central Visayas', cities: ['Tagbilaran'].sort() },
  { name: 'Cebu', region: 'Central Visayas', cities: ['Cebu City', 'Lapu-Lapu', 'Mandaue', 'Talisay', 'Toledo'].sort() },
  { name: 'Negros Oriental', region: 'Central Visayas', cities: ['Dumaguete'].sort() },
  { name: 'Siquijor', region: 'Central Visayas', cities: ['Siquijor'].sort() },

  // Region VIII - Eastern Visayas
  { name: 'Biliran', region: 'Eastern Visayas', cities: ['Naval'].sort() },
  { name: 'Eastern Samar', region: 'Eastern Visayas', cities: ['Borongan'].sort() },
  { name: 'Leyte', region: 'Eastern Visayas', cities: ['Ormoc', 'Tacloban'].sort() },
  { name: 'Northern Samar', region: 'Eastern Visayas', cities: ['Catarman'].sort() },
  { name: 'Samar', region: 'Eastern Visayas', cities: ['Catbalogan'].sort() },
  { name: 'Southern Leyte', region: 'Eastern Visayas', cities: ['Maasin'].sort() },

  // Region IX - Zamboanga Peninsula
  { name: 'Zamboanga del Norte', region: 'Zamboanga', cities: ['Dipolog'].sort() },
  { name: 'Zamboanga del Sur', region: 'Zamboanga', cities: ['Pagadian', 'Zamboanga City'].sort() },
  { name: 'Zamboanga Sibugay', region: 'Zamboanga', cities: ['Ipil'].sort() },

  // Region X - Northern Mindanao
  { name: 'Bukidnon', region: 'Northern Mindanao', cities: ['Malaybalay', 'Valencia'].sort() },
  { name: 'Camiguin', region: 'Northern Mindanao', cities: ['Mambajao'].sort() },
  { name: 'Lanao del Norte', region: 'Northern Mindanao', cities: ['Iligan'].sort() },
  { name: 'Misamis Occidental', region: 'Northern Mindanao', cities: ['Oroquieta'].sort() },
  { name: 'Misamis Oriental', region: 'Northern Mindanao', cities: ['Cagayan de Oro', 'Gingoog'].sort() },

  // Region XI - Davao Region
  { name: 'Compostela Valley', region: 'Davao', cities: ['Nabunturan'].sort() },
  { name: 'Davao del Norte', region: 'Davao', cities: ['Panabo', 'Tagum'].sort() },
  { name: 'Davao del Sur', region: 'Davao', cities: ['Davao City', 'Digos'].sort() },
  { name: 'Davao Occidental', region: 'Davao', cities: ['Malita'].sort() },
  { name: 'Davao Oriental', region: 'Davao', cities: ['Mati'].sort() },

  // Region XII - Soccsksargen
  { name: 'Cotabato', region: 'Soccsksargen', cities: ['Kidapawan'].sort() },
  { name: 'Sarangani', region: 'Soccsksargen', cities: ['Alabel'].sort() },
  { name: 'South Cotabato', region: 'Soccsksargen', cities: ['General Santos', 'Koronadal'].sort() },
  { name: 'Sultan Kudarat', region: 'Soccsksargen', cities: ['Isulan'].sort() },

  // Region XIII - Caraga
  { name: 'Agusan del Norte', region: 'Caraga', cities: ['Cabadbaran', 'Butuan'].sort() },
  { name: 'Agusan del Sur', region: 'Caraga', cities: ['Bayugan', 'San Francisco'].sort() },
  { name: 'Dinagat Islands', region: 'Caraga', cities: ['San Jose'].sort() },
  { name: 'Surigao del Norte', region: 'Caraga', cities: ['Siargao', 'Surigao'].sort() },
  { name: 'Surigao del Sur', region: 'Caraga', cities: ['Bislig', 'Tandag'].sort() },

  // BARMM - Bangsamoro
  { name: 'Basilan', region: 'BARMM', cities: ['Isabela City'].sort() },
  { name: 'Lanao del Sur', region: 'BARMM', cities: ['Marawi'].sort() },
  { name: 'Maguindanao', region: 'BARMM', cities: ['Cotabato City'].sort() },
  { name: 'Sulu', region: 'BARMM', cities: ['Jolo'].sort() },
  { name: 'Tawi-Tawi', region: 'BARMM', cities: ['Bongao'].sort() },

  // Special
  { name: 'Metro Manila (NCR)', region: 'NCR', cities: ['Caloocan', 'Las Piñas', 'Makati', 'Malabon', 'Mandaluyong', 'Manila', 'Marikina', 'Muntinlupa', 'Navotas', 'Parañaque', 'Pasay', 'Pasig', 'Quezon City', 'San Juan', 'Taguig (BGC)', 'Valenzuela'].sort() },
  { name: 'Other Province', region: 'Other', cities: [] },
  { name: 'Overseas', region: 'Special', cities: [] },
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

  const parts = location.split(', ').map(s => s.trim())
  if (parts.length === 2) {
    const matchedProvince = LOCATION_DATA.find(p =>
      p.name.toLowerCase() === parts[1].toLowerCase() ||
      p.name.toLowerCase().includes(parts[1].toLowerCase())
    )
    if (matchedProvince) {
      const matchedCity = matchedProvince.cities.find(c =>
        c.toLowerCase() === parts[0].toLowerCase()
      )
      if (matchedCity) {
        return { province: matchedProvince.name, city: matchedCity }
      }
      return { province: matchedProvince.name, city: parts[0] }
    }
  }

  const matchedProvince = LOCATION_DATA.find(p =>
    p.name.toLowerCase() === location.toLowerCase()
  )
  if (matchedProvince) {
    return { province: matchedProvince.name, city: '' }
  }

  if (location.startsWith('NCR') || location.startsWith('Metro Manila')) {
    const city = location.replace('NCR - ', '').replace('NCR', '').replace('Metro Manila', '').replace('(', '').replace(')', '').trim()
    return { province: 'Metro Manila (NCR)', city: city || '' }
  }

  return { province: 'Other Province', city: location }
}

// Region utilities for 3-level cascading
export const REGIONS = [...new Set(LOCATION_DATA.map(p => p.region))]

export function getProvincesByRegion(region: string): Province[] {
  return LOCATION_DATA.filter(p => p.region === region)
}

export function parseLocation3Level(location: string): { region: string; province: string; city: string } {
  if (!location) return { region: '', province: '', city: '' }

  // Try 2-level parse first
  const parsed = parseLocation(location)
  if (parsed.province) {
    const provinceData = LOCATION_DATA.find(p => p.name === parsed.province)
    if (provinceData) {
      return { region: provinceData.region, province: parsed.province, city: parsed.city }
    }
  }

  // Check NCR/Metro Manila
  if (location.startsWith('NCR') || location.startsWith('Metro Manila')) {
    const city = location.replace('NCR - ', '').replace('NCR', '').replace('Metro Manila', '').replace('(', '').replace(')', '').trim()
    return { region: 'NCR', province: 'Metro Manila (NCR)', city: city || '' }
  }

  return { region: '', province: parsed.province, city: parsed.city }
}
