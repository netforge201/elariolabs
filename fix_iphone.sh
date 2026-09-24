sed -i '' '/<div className="w-full h-full bg-zinc-950 p-4 pt-12 flex flex-col gap-4">/,/<\/div>.*{.*Mock App Cards.*}/c\
            {settings?.heroImage?.url ? (\
              <img src={settings.heroImage.url} alt="" className="w-full h-full object-cover" />\
            ) : (\
            <div className="w-full h-full bg-zinc-950 p-4 pt-12 flex flex-col gap-4">\
              <div className="text-white text-xl font-bold mb-4">Today</div>\
              \
              {/* Mock App Cards */}\
              <div className="w-full h-48 bg-[#0a3f2b] rounded-2xl p-4 flex flex-col justify-end border border-white/5">\
                <h3 className="text-white font-bold">LandlordTaxPack</h3>\
                <p className="text-[10px] text-zinc-300">Track, organize and prep your rental records.</p>\
              </div>' src/app/\(public\)/page.tsx
