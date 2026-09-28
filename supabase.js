(function(){
  var BASE = 'https://ummojibwssvfmdpthzml.supabase.co/rest/v1';
  var KEY = 'sb_publishable_QFW1jF1nQ2Oe1zy7TeQOMw_bsE6DZiX';
  var nativeSetItem = Storage.prototype.setItem;
  var nativeRemoveItem = Storage.prototype.removeItem;
  var nativeGetItem = Storage.prototype.getItem;
  var syncTimers = Object.create(null);
  var syncDelayMs = 350;

  function directSet(key, value) {
    nativeSetItem.call(window.localStorage, key, value);
  }

  function directGet(key) {
    return nativeGetItem.call(window.localStorage, key);
  }

  function directRemove(key) {
    nativeRemoveItem.call(window.localStorage, key);
  }

  function parseJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function withOptionalId(row, idValue) {
    if (idValue !== null && idValue !== undefined && idValue !== '') row.id = idValue;
    return row;
  }

  function isMeaningful(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value) && value !== 0;
    return !!value;
  }

  function request(path, options) {
    options = options || {};
    var headers = options.headers || {};
    var mergedHeaders = {
      'apikey': KEY,
      'Authorization': 'Bearer ' + KEY
    };
    Object.keys(headers).forEach(function(key){ mergedHeaders[key] = headers[key]; });

    return fetch(BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, ''), {
      method: options.method || 'GET',
      headers: mergedHeaders,
      body: options.body
    }).then(function(res){
      if (!res.ok) {
        return res.text().then(function(text){
          throw new Error('Supabase ' + res.status + ' en ' + path + ': ' + text);
        });
      }
      if (res.status === 204) return null;
      return res.text().then(function(text){
        return text ? JSON.parse(text) : null;
      });
    });
  }

  window.SUPABASE_REST_URL = BASE;
  window.SUPABASE_ANON_KEY = KEY;
  window.supabaseRestRequest = request;
  window.supabaseDirectSet = function(key, value) { directSet(key, value); };

  function deleteAllFromTable(table) {
    return request(table + '?id=gt.0', { method: 'DELETE' });
  }

  function syncCollection(table, rows) {
    rows = Array.isArray(rows) ? rows : [];
    return deleteAllFromTable(table).then(function(){
      if (!rows.length) return null;
      return request(table, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(rows)
      });
    });
  }

  function upsertSiteSetting(settingKey, value) {
    return request('site_settings?on_conflict=setting_key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify([{
        setting_key: settingKey,
        setting_value: value
      }])
    });
  }

  function deleteSiteSetting(settingKey) {
    return request('site_settings?setting_key=eq.' + encodeURIComponent(settingKey), {
      method: 'DELETE'
    });
  }

  function upsertMetric(metricKey, value) {
    return request('site_metrics?on_conflict=metric_key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify([{
        metric_key: metricKey,
        metric_value: value,
        updated_at: new Date().toISOString()
      }])
    });
  }

  function upsertBusinessHours(hours) {
    return request('business_hours?on_conflict=id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify([{
        id: 1,
        days_text: hours.days || 'Lunes a Viernes',
        start_time: hours.start || '08:00',
        end_time: hours.end || '17:00',
        warn_minutes: hours.warnMin || 30,
        days_of_week: Array.isArray(hours.daysOfWeek) ? hours.daysOfWeek : []
      }])
    });
  }

  function deleteBusinessHours() {
    return request('business_hours?id=eq.1', { method: 'DELETE' });
  }

  function scheduleSync(key, value, isRemove) {
    clearTimeout(syncTimers[key]);
    syncTimers[key] = setTimeout(function(){
      runSync(key, value, isRemove).catch(function(err){
        console.warn('[Supabase sync]', key, err);
      });
    }, syncDelayMs);
  }

  function runSync(key, value, isRemove) {
    if (key === 'products') {
      var productList = parseJson(value, []);
      return syncCollection('products', productList.map(function(item, index){
        return withOptionalId({
          name: item.name || '',
          price_text: item.price || '—',
          numeric_price: parseFloat(String(item.price || '').replace(/[^0-9.]/g, '')) || null,
          condition: item.condition || 'Nuevo',
          category: item.category || '',
          icon: item.icon || 'lucide:smartphone',
          color: item.color || 'text-slate-300',
          description: item.desc || '',
          sort_order: index + 1,
          is_active: true
        }, item.id);
      }));
    }

    if (key === 'partners') {
      return syncCollection('partners', parseJson(value, []).map(function(item, index){
        return withOptionalId({
          name: item.name || '',
          role: item.role || '',
          icon: item.icon || 'lucide:globe',
          color: item.color || 'text-slate-300',
          description: item.desc || '',
          url: item.url || '',
          sort_order: index + 1,
          is_active: true
        }, item.id);
      }));
    }

    if (key === 'messages') {
      return syncCollection('contact_requests', parseJson(value, []).map(function(item){
        return withOptionalId({
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          service: item.service || 'otro',
          other_service: item.otro_service || '',
          device_type: item.device_type || '',
          device_model: item.device_model || '',
          message: item.message || '',
          status: item.status || 'pendiente',
          source_page: 'index',
          created_at: item.date || new Date().toISOString()
        }, item.id);
      }));
    }

    if (key === 'gastos') {
      return syncCollection('expenses', parseJson(value, []).map(function(item){
        return withOptionalId({
          description: item.descripcion || '',
          amount: parseFloat(item.monto || 0) || 0,
          category: item.categoria || 'Otros',
          spent_on: item.fecha || new Date().toISOString().slice(0, 10)
        }, item.id);
      }));
    }

    if (key === 'siteConfig') {
      return isRemove ? deleteSiteSetting('siteConfig') : upsertSiteSetting('siteConfig', parseJson(value, {}));
    }

    if (key === 'adminUsers') {
      return isRemove ? deleteSiteSetting('adminUsers') : upsertSiteSetting('adminUsers', parseJson(value, []));
    }

    if (key === 'pageViews') {
      trackDailyView();
      return upsertMetric('pageViews', parseInt(value || '0', 10) || 0);
    }

    if (key === 'SITE_SCHEDULE') {
      return isRemove ? deleteBusinessHours() : upsertBusinessHours(parseJson(value, {}));
    }

    return Promise.resolve(null);
  }

  function patchLocalStorage() {
    if (window.__supabaseStoragePatched) return;
    window.__supabaseStoragePatched = true;

    Storage.prototype.setItem = function(key, value) {
      nativeSetItem.call(this, key, value);
      if (this === window.localStorage) scheduleSync(key, value, false);
    };

    Storage.prototype.removeItem = function(key) {
      nativeRemoveItem.call(this, key);
      if (this === window.localStorage) scheduleSync(key, null, true);
    };
  }

  function hydrateLocal(key, remoteValue, emptyValue, importRemote) {
    var existingRaw = directGet(key);
    var existingValue = typeof emptyValue === 'string' ? existingRaw : parseJson(existingRaw, emptyValue);

    if (isMeaningful(remoteValue)) {
      directSet(key, typeof remoteValue === 'string' ? remoteValue : JSON.stringify(remoteValue));
      return;
    }

    if (isMeaningful(existingValue)) {
      importRemote(existingValue);
      return;
    }

    if (emptyValue !== undefined) {
      directSet(key, typeof emptyValue === 'string' ? emptyValue : JSON.stringify(emptyValue));
    }
  }

  function trackDailyView() {
    return request('rpc/increment_daily_views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(function() {});
  }

  function loadPageViewsDaily(days) {
    var d = days || 30;
    var since = new Date();
    since.setDate(since.getDate() - (d - 1));
    var sinceStr = since.toISOString().slice(0, 10);
    return request('page_views_daily?view_date=gte.' + sinceStr + '&order=view_date.asc&select=view_date,view_count');
  }

  window.supabaseLoadPageViewsDaily = loadPageViewsDaily;

  function loadProducts() {
    return request('products?select=*&order=sort_order.asc,id.asc').then(function(rows) {
      return (rows || []).map(function(row) {
        return {
          id: row.id,
          name: row.name,
          price: row.price_text,
          condition: row.condition,
          category: row.category,
          icon: row.icon,
          color: row.color,
          desc: row.description,
          images: []
        };
      });
    });
  }

  function loadPartners() {
    return request('partners?select=*&order=sort_order.asc,id.asc').then(function(rows){
      return (rows || []).map(function(row){
        return {
          id: row.id,
          name: row.name,
          role: row.role,
          icon: row.icon,
          color: row.color,
          desc: row.description,
          url: row.url
        };
      });
    });
  }

  function loadMessages() {
    return request('contact_requests?select=*&order=created_at.asc,id.asc').then(function(rows){
      return (rows || []).map(function(row){
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          service: row.service,
          otro_service: row.other_service,
          message: row.message,
          status: row.status,
          date: row.created_at
        };
      });
    });
  }

  function loadReviews() {
    return request('reviews?select=*&order=created_at.desc,id.desc').then(function(rows){
      return (rows || []).map(function(row){
        return {
          id: row.id,
          name: row.name,
          role: row.role,
          text: row.text,
          rating: row.rating,
          status: row.status,
          photo: row.photo || '',
          years: row.years || 0,
          website: row.website || '',
          instagram: row.instagram || '',
          linkedin: row.linkedin || '',
          date: row.created_at
        };
      });
    });
  }

  function loadExpenses() {
    return request('expenses?select=*&order=spent_on.asc,id.asc').then(function(rows){
      return (rows || []).map(function(row){
        return {
          id: row.id,
          descripcion: row.description,
          monto: row.amount,
          categoria: row.category,
          fecha: row.spent_on
        };
      });
    });
  }

  function loadSiteSetting(settingKey) {
    return request('site_settings?setting_key=eq.' + encodeURIComponent(settingKey) + '&select=setting_value').then(function(rows){
      return rows && rows[0] ? rows[0].setting_value : null;
    });
  }

  function loadBusinessHours() {
    return request('business_hours?id=eq.1&select=*').then(function(rows){
      var row = rows && rows[0];
      if (!row) return null;
      return {
        days: row.days_text || '',
        start: row.start_time ? String(row.start_time).slice(0, 5) : '',
        end: row.end_time ? String(row.end_time).slice(0, 5) : '',
        warnMin: row.warn_minutes || 30,
        daysOfWeek: Array.isArray(row.days_of_week) ? row.days_of_week : []
      };
    });
  }

  function loadDeviceListings() {
    return request('device_listings?select=*&status=eq.approved&order=created_at.desc').then(function(rows){
      return (rows || []).map(function(row){
        return {
          id: row.id,
          name: row.name,
          phone: row.phone,
          contact_method: row.contact_method,
          device_type: row.device_type,
          device_model: row.device_model,
          message: row.message,
          photos: row.photos || [],
          status: row.status,
          date: row.created_at
        };
      });
    });
  }

  function loadMetric(metricKey) {
    return request('site_metrics?metric_key=eq.' + encodeURIComponent(metricKey) + '&select=metric_value').then(function(rows){
      return rows && rows[0] ? rows[0].metric_value : null;
    });
  }

  async function init() {
    patchLocalStorage();

    var isIndex = !!window.SUPABASE_INDEX_PAGE;

    try {
      var results = await Promise.all([
        loadProducts(),
        loadPartners(),
        isIndex ? Promise.resolve([])   : loadMessages(),
        Promise.resolve([]),
        isIndex ? Promise.resolve([])   : loadExpenses(),
        loadSiteSetting('siteConfig'),
        isIndex ? Promise.resolve(null) : loadSiteSetting('adminUsers'),
        loadBusinessHours(),
        loadMetric('pageViews'),
        loadDeviceListings()
      ]);

      hydrateLocal('products',  results[0], [], function(value){ runSync('products',  JSON.stringify(value), false); });
      hydrateLocal('partners',  results[1], [], function(value){ runSync('partners',  JSON.stringify(value), false); });
      if (!isIndex) hydrateLocal('messages',   results[2], [], function(value){ runSync('messages',   JSON.stringify(value), false); });
      if (!isIndex) hydrateLocal('gastos',     results[4], [], function(value){ runSync('gastos',     JSON.stringify(value), false); });
      hydrateLocal('siteConfig',results[5], {}, function(value){ runSync('siteConfig',JSON.stringify(value), false); });
      if (!isIndex) hydrateLocal('adminUsers', results[6], [], function(value){ runSync('adminUsers', JSON.stringify(value), false); });
      hydrateLocal('SITE_SCHEDULE', results[7], {}, function(value){ runSync('SITE_SCHEDULE', JSON.stringify(value), false); });
      directSet('device_listings', JSON.stringify(results[9] || []));

      if (results[8] !== null && results[8] !== undefined) {
        directSet('pageViews', String(results[8]));
      } else if (directGet('pageViews')) {
        runSync('pageViews', directGet('pageViews'), false);
      } else {
        directSet('pageViews', '0');
      }
    } catch (err) {
      console.warn('[Supabase init]', err);
    }
  }

  window.__supabaseReady = init();
})();
