import { createClient } from '@/lib/supabase/server'

export default async function AboutPage() {
  const supabase = await createClient()

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('*')
    .single()

  const { data: officers } = await supabase
    .from('officers')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-12">About Us</h1>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-green-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Mission</h2>
            <p className="text-gray-700">
              {orgInfo?.mission || 'To be updated.'}
            </p>
          </div>
          <div className="bg-green-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Vision</h2>
            <p className="text-gray-700">
              {orgInfo?.vision || 'To be updated.'}
            </p>
          </div>
        </div>

        {/* About / Additional Info */}
        {orgInfo?.about && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-6">About Us</h2>
            <div className="bg-white p-8 rounded-lg border">
              {orgInfo.about.split('\n').map((paragraph, i) => (
                <p key={i} className="text-gray-700 mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Officers */}
        <h2 className="text-2xl font-bold text-center mb-8">Our Officers</h2>
        {officers && officers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {officers.map((officer) => (
              <div key={officer.id} className="text-center">
                <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full mb-4 overflow-hidden">
                  {officer.photo_url ? (
                    <img
                      src={officer.photo_url}
                      alt={officer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Photo
                    </div>
                  )}
                </div>
                <h3 className="font-bold">{officer.name}</h3>
                <p className="text-green-700 text-sm">{officer.position}</p>
                {officer.term_year && (
                  <p className="text-gray-500 text-xs">{officer.term_year}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            Officers to be announced.
          </p>
        )}
      </div>
    </div>
  )
}
