import '@/assets/tailwind.css'
import { useSettingsStore } from '@/hooks/useSettingsStore'

export default function Options () {
  const [settings, setSettings, isPersistent, error, isInitialStateResolved] =
    useSettingsStore()

  const handleChange = (event: { target: { name: any; checked: any } }) => {
    setSettings((prevState: any) => {
      return {
        ...prevState,
        [event.target.name]: event.target.checked
      }
    })
  }

  useEffect(() => {
    setSettings(settings);
    console.log('hello')
  }, [])

  return (
    <main>
      <div className='flex flex-col dark:bg-black dark:text-white bg-white text-black'>
        <div className='flex space-x-1.5'>
          {Object.keys(settings).map((v, i) => (
            <div key={`li${i}_${v}`}>
              <label>
                <input
                  type='checkbox'
                  name={v}
                  checked={settings[v]}
                  onChange={handleChange}
                />
                <span>{v}</span>
              </label>
            </div>
          ))}
        </div>
        {isInitialStateResolved && (
          <div>Initial state from "chrome.storage" is loaded</div>
        )}
        {!isPersistent && (
          <div>Error writing to the chrome.storage: {error}</div>
        )}
      </div>
    </main>
  )
}
