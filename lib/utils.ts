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
  { name: 'Ilocos Norte', region: 'Ilocos', cities: ['Laoag', 'Batac'] },
  { name: 'Ilocos Sur', region: 'Ilocos', cities: ['Vigan', 'Candon'] },
  { name: 'La Union', region: 'Ilocos', cities: ['San Fernando'] },
  { name: 'Pangasinan', region: 'Ilocos', cities: ['Dagupan', 'San Carlos', 'Urdaneta', 'Lingayen'] },

  // Region II - Cagayan Valley
  { name: 'Batanes', region: 'Cagayan Valley', cities: ['Basco'] },
  { name: 'Cagayan', region: 'Cagayan Valley', cities: ['Tuguegarao'] },
  { name: 'Isabela', region: 'Cagayan Valley', cities: ['Santiago', 'Ilagan', 'Cauayan'] },
  { name: 'Nueva Vizcaya', region: 'Cagayan Valley', cities: ['Bayombong'] },
  { name: 'Quirino', region: 'Cagayan Valley', cities: ['Cabarroguis'] },

  // Region III - Central Luzon
  { name: 'Aurora', region: 'Central Luzon', cities: ['Baler'] },
  { name: 'Bataan', region: 'Central Luzon', cities: ['Balanga'] },
  { name: 'Bulacan', region: 'Central Luzon', cities: ['San Jose del Monte', 'Meycauayan', 'Marilao', 'Bocaue', 'Balagtas', 'Guiguinto'] },
  { name: 'Nueva Ecija', region: 'Central Luzon', cities: ['Cabanatuan', 'San Jose', 'Gapan'] },
  { name: 'Pampanga', region: 'Central Luzon', cities: ['Angeles City', 'San Fernando', 'Mabalacat', 'Guagua', 'Lubao'] },
  { name: 'Tarlac', region: 'Central Luzon', cities: ['Tarlac City'] },
  { name: 'Zambales', region: 'Central Luzon', cities: ['Olongapo', 'Iba'] },

  // Region IV-A - Calabarzon
  { name: 'Batangas', region: 'Calabarzon', cities: ['Batangas City', 'Lipa', 'Tanauan', 'Santo Tomas', 'Malvar', 'Taal', 'Nasugbu', 'Calatagan', 'Balayan', 'Lemery'] },
  { name: 'Cavite', region: 'Calabarzon', cities: ['Imus', 'Dasmariñas', 'Bacoor', 'General Trias', 'Trece Martires', 'Tagaytay', 'Silang', 'Amadeo', 'Kawit', 'Noveleta', 'Rosario'] },
  { name: 'Laguna', region: 'Calabarzon', cities: ['San Pedro', 'Biñan', 'Santa Rosa', 'Cabuyao', 'Calamba', 'Los Baños', 'Sta. Cruz', 'Victoria', 'Nagcarlan', 'Pagsanjan', 'Lumban', 'Kalayaan', 'Bay', 'Calauan', 'Alaminos', 'San Pablo'] },
  { name: 'Quezon', region: 'Calabarzon', cities: ['Lucena', 'Tayabas', 'Sariaya', 'Candelaria'] },
  { name: 'Rizal', region: 'Calabarzon', cities: ['Antipolo', 'Taytay', 'Cainta', 'Binangonan', 'Angono', 'Cardona'] },

  // Region IV-B - Mimaropa
  { name: 'Marinduque', region: 'Mimaropa', cities: ['Boac'] },
  { name: 'Occidental Mindoro', region: 'Mimaropa', cities: ['San Jose'] },
  { name: 'Oriental Mindoro', region: 'Mimaropa', cities: ['Calapan'] },
  { name: 'Palawan', region: 'Mimaropa', cities: ['Puerto Princesa'] },
  { name: 'Romblon', region: 'Mimaropa', cities: ['Romblon'] },

  // Region V - Bicol
  { name: 'Albay', region: 'Bicol', cities: ['Legazpi', 'Tabaco', 'Ligao'] },
  { name: 'Camarines Norte', region: 'Bicol', cities: ['Daet'] },
  { name: 'Camarines Sur', region: 'Bicol', cities: ['Naga', 'Iriga'] },
  { name: 'Catanduanes', region: 'Bicol', cities: ['Virac'] },
  { name: 'Masbate', region: 'Bicol', cities: ['Masbate City'] },
  { name: 'Sorsogon', region: 'Bicol', cities: ['Sorsogon City'] },

  // Region VI - Western Visayas
  { name: 'Aklan', region: 'Western Visayas', cities: ['Kalibo'] },
  { name: 'Antique', region: 'Western Visayas', cities: ['San Jose de Buenavista'] },
  { name: 'Capiz', region: 'Western Visayas', cities: ['Roxas'] },
  { name: 'Guimaras', region: 'Western Visayas', cities: ['Jordan'] },
  { name: 'Iloilo', region: 'Western Visayas', cities: ['Iloilo City', 'Passi'] },
  { name: 'Negros Occidental', region: 'Western Visayas', cities: ['Bacolod', 'Talisay', 'Silay'] },

  // Region VII - Central Visayas
  { name: 'Bohol', region: 'Central Visayas', cities: ['Tagbilaran'] },
  { name: 'Cebu', region: 'Central Visayas', cities: ['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Talisay', 'Toledo'] },
  { name: 'Negros Oriental', region: 'Central Visayas', cities: ['Dumaguete'] },
  { name: 'Siquijor', region: 'Central Visayas', cities: ['Siquijor'] },

  // Region VIII - Eastern Visayas
  { name: 'Biliran', region: 'Eastern Visayas', cities: ['Naval'] },
  { name: 'Eastern Samar', region: 'Eastern Visayas', cities: ['Borongan'] },
  { name: 'Leyte', region: 'Eastern Visayas', cities: ['Tacloban', 'Ormoc'] },
  { name: 'Northern Samar', region: 'Eastern Visayas', cities: ['Catarman'] },
  { name: 'Samar', region: 'Eastern Visayas', cities: ['Catbalogan'] },
  { name: 'Southern Leyte', region: 'Eastern Visayas', cities: ['Maasin'] },

  // Region IX - Zamboanga Peninsula
  { name: 'Zamboanga del Norte', region: 'Zamboanga', cities: ['Dipolog'] },
  { name: 'Zamboanga del Sur', region: 'Zamboanga', cities: ['Pagadian', 'Zamboanga City'] },
  { name: 'Zamboanga Sibugay', region: 'Zamboanga', cities: ['Ipil'] },

  // Region X - Northern Mindanao
  { name: 'Bukidnon', region: 'Northern Mindanao', cities: ['Malaybalay', 'Valencia'] },
  { name: 'Camiguin', region: 'Northern Mindanao', cities: ['Mambajao'] },
  { name: 'Lanao del Norte', region: 'Northern Mindanao', cities: ['Iligan'] },
  { name: 'Misamis Occidental', region: 'Northern Mindanao', cities: ['Oroquieta'] },
  { name: 'Misamis Oriental', region: 'Northern Mindanao', cities: ['Cagayan de Oro', 'Gingoog'] },

  // Region XI - Davao Region
  { name: 'Compostela Valley', region: 'Davao', cities: ['Nabunturan'] },
  { name: 'Davao del Norte', region: 'Davao', cities: ['Tagum', 'Panabo'] },
  { name: 'Davao del Sur', region: 'Davao', cities: ['Davao City', 'Digos'] },
  { name: 'Davao Occidental', region: 'Davao', cities: ['Malita'] },
  { name: 'Davao Oriental', region: 'Davao', cities: ['Mati'] },

  // Region XII - Soccsksargen
  { name: 'Cotabato', region: 'Soccsksargen', cities: ['Kidapawan'] },
  { name: 'Sarangani', region: 'Soccsksargen', cities: ['Alabel'] },
  { name: 'South Cotabato', region: 'Soccsksargen', cities: ['Koronadal', 'General Santos'] },
  { name: 'Sultan Kudarat', region: 'Soccsksargen', cities: ['Isulan'] },

  // Region XIII - Caraga
  { name: 'Agusan del Norte', region: 'Caraga', cities: ['Butuan', 'Cabadbaran'] },
  { name: 'Agusan del Sur', region: 'Caraga', cities: ['Bayugan', 'San Francisco'] },
  { name: 'Dinagat Islands', region: 'Caraga', cities: ['San Jose'] },
  { name: 'Surigao del Norte', region: 'Caraga', cities: ['Surigao', 'Siargao'] },
  { name: 'Surigao del Sur', region: 'Caraga', cities: ['Tandag', 'Bislig'] },

  // BARMM - Bangsamoro
  { name: 'Basilan', region: 'BARMM', cities: ['Isabela City'] },
  { name: 'Lanao del Sur', region: 'BARMM', cities: ['Marawi'] },
  { name: 'Maguindanao', region: 'BARMM', cities: ['Cotabato City'] },
  { name: 'Sulu', region: 'BARMM', cities: ['Jolo'] },
  { name: 'Tawi-Tawi', region: 'BARMM', cities: ['Bongao'] },

  // Special
  { name: 'Metro Manila (NCR)', region: 'NCR', cities: ['Manila', 'Makati', 'Pasig', 'Taguig (BGC)', 'Quezon City', 'Caloocan', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Pasay', 'Mandaluyong', 'San Juan', 'Marikina', 'Malabon', 'Navotas', 'Valenzuela'] },
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
