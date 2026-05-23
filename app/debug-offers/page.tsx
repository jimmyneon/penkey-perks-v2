import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DebugOffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if tables exist
  const { data: tables } = await supabase
    .from('promotional_offers')
    .select('*')
    .limit(1)

  // Get all offers
  const { data: allOffers, error: offersError } = await supabase
    .from('promotional_offers')
    .select('*')
    .order('priority', { ascending: true })

  // Get user's points
  const { data: pointsData } = await supabase
    .from('points_transactions')
    .select('amount')
    .eq('user_id', user.id)

  const userPoints = pointsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

  // Get user's created date
  const { data: userData } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', user.id)
    .single()

  // Try the RPC function
  const { data: rpcOffers, error: rpcError } = await supabase
    .rpc('get_user_promotional_offers', { p_user_id: user.id })

  // Check user interactions
  const { data: interactions } = await supabase
    .from('user_promotional_offers')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🔍 Promotional Offers Debug</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">👤 User Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Points:</strong> {userPoints}</p>
            <p><strong>Created:</strong> {userData?.created_at}</p>
            <p><strong>Days Old:</strong> {Math.floor((Date.now() - new Date(userData?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24))}</p>
          </div>
        </div>

        {/* Tables Check */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">📊 Tables Check</h2>
          <p className="font-mono text-sm">
            {tables !== null ? '✅ promotional_offers table exists' : '❌ promotional_offers table NOT found'}
          </p>
        </div>

        {/* All Offers */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">🎁 All Offers in Database</h2>
          {offersError && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-mono text-sm">Error: {offersError.message}</p>
            </div>
          )}
          {allOffers && allOffers.length === 0 && (
            <p className="text-gray-500">No offers found in database</p>
          )}
          {allOffers && allOffers.length > 0 && (
            <div className="space-y-4">
              {allOffers.map((offer: any) => (
                <div key={offer.id} className="border rounded p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{offer.icon} {offer.title}</h3>
                      <p className="text-sm text-gray-600">{offer.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${offer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {offer.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    <p>Priority: {offer.priority}</p>
                    <p>Show Modal: {offer.show_as_modal ? '✅' : '❌'}</p>
                    <p>Target: {offer.target_audience}</p>
                    <p>Min Beans: {offer.min_beans || 'None'}</p>
                    <p>Max Beans: {offer.max_beans || 'None'}</p>
                    <p>Redemptions: {offer.redemptions_count}/{offer.total_redemption_limit || '∞'}</p>
                    <p>Start: {offer.start_date ? new Date(offer.start_date).toLocaleDateString() : 'None'}</p>
                    <p>End: {offer.end_date ? new Date(offer.end_date).toLocaleDateString() : 'None'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RPC Function Result */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">🔧 RPC Function Result</h2>
          {rpcError && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-red-800 font-mono text-sm">Error: {rpcError.message}</p>
            </div>
          )}
          {rpcOffers && rpcOffers.length === 0 && (
            <p className="text-gray-500">No offers returned for this user (check targeting criteria)</p>
          )}
          {rpcOffers && rpcOffers.length > 0 && (
            <div className="space-y-4">
              {rpcOffers.map((offer: any) => (
                <div key={offer.id} className="border rounded p-4 bg-green-50">
                  <h3 className="font-semibold">✅ {offer.icon} {offer.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    <p>Priority: {offer.priority}</p>
                    <p>Show Modal: {offer.show_as_modal ? '✅' : '❌'}</p>
                    <p>Has Redeemed: {offer.has_redeemed ? '✅' : '❌'}</p>
                    <p>Redemptions Left: {offer.redemptions_remaining || '∞'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Interactions */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">📝 Your Interactions</h2>
          {interactions && interactions.length === 0 && (
            <p className="text-gray-500">No interactions yet</p>
          )}
          {interactions && interactions.length > 0 && (
            <div className="space-y-2">
              {interactions.map((interaction: any) => (
                <div key={interaction.id} className="border rounded p-3 text-sm">
                  <p><strong>Offer ID:</strong> {interaction.offer_id}</p>
                  <p><strong>Viewed:</strong> {interaction.viewed_at ? new Date(interaction.viewed_at).toLocaleString() : 'No'}</p>
                  <p><strong>Redeemed:</strong> {interaction.redeemed_at ? new Date(interaction.redeemed_at).toLocaleString() : 'No'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">🌐 API Test</h2>
          <p className="text-sm text-gray-600 mb-2">Open browser console and run:</p>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`fetch('/api/promotional-offers/get')
  .then(r => r.json())
  .then(console.log)`}
          </pre>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <a href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</a>
        </div>
      </div>
    </div>
  )
}
