import { useState, useEffect } from 'react';

const Sum = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [summarizedText, setSummarizedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false); 
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [messages, setMessages] = useState([]); 

  // Function to handle input text change and detect language
  const handleInputChange = async (event) => {
    const text = event.target.value;
    setInputText(text);

    // Detecting language using the language detector API
    if ('ai' in self && 'languageDetector' in self.ai) {
      try {
        const languageDetectorCapabilities = await self.ai.languageDetector.capabilities();
        
        let detector;
        if (languageDetectorCapabilities === 'readily') {
          detector = await self.ai.languageDetector.create();
        } else if (languageDetectorCapabilities === 'after-download') {
          detector = await self.ai.languageDetector.create({
            monitor(m) {
              m.addEventListener('downloadprogress', (e) => {
                console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
              });
            },
          });
          await detector.ready;
        } else {
          console.error('Language Detector API is not supported.');
          return;
        }

        const results = await detector.detect(text);
        const detectedLang = results[0]?.detectedLanguage;
        const confidence = results[0]?.confidence;

        if (detectedLang && confidence >= 0.5) {
          setDetectedLanguage(detectedLang);
          setSourceLanguage(detectedLang); 
        } else {
          setDetectedLanguage('Unknown');
        }
      } catch (error) {
        console.error('Error detecting language:', error);
        setDetectedLanguage('Error');
      }
    }
  };

  const handleSourceLanguageChange = (event) => {
    setSourceLanguage(event.target.value);
  };

  const handleTargetLanguageChange = (event) => {
    setTargetLanguage(event.target.value);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);

    try {
      if ('ai' in self && 'translator' in self.ai) {
        const translator = await self.ai.translator.create({
          sourceLanguage,
          targetLanguage,
        });

        const result = await translator.translate(inputText);
        setTranslatedText(result);

        // Add input and translated message to chat
        setMessages([ 
          ...messages, 
          { text: inputText, type: 'input' },
          { text: result, type: 'translated' },
        ]);
      } else {
        alert('Translator API is not supported.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('There was an error translating the text.');
    }

    setIsTranslating(false);
  };

  // Function to summarize text
  const handleSummarize = async () => {
    if (inputText.trim().split(' ').length > 30) {
      setIsSummarizing(true);
      try {
        // Check if Summarizer API is available
        const available = (await self.ai.summarizer.capabilities()).available;

        let summarizer;
        if (available === 'no') {
          // The Summarizer API isn't usable.
          alert('Summarizer API is not available.');
          return;
        }

        // Create the Summarizer API object
        const options = {
          sharedContext: 'This is a general article.',
          type: 'key-points',
          format: 'markdown', 
          length: 'medium', 
        };

        if (available === 'readily') {
          summarizer = await self.ai.summarizer.create(options);
        } else if (available === 'after-download') {
          summarizer = await self.ai.summarizer.create(options);
          summarizer.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
          await summarizer.ready;
        }

        
        const summary = await summarizer.summarize(inputText);

       
        setSummarizedText(summary);

      
        setMessages([
          ...messages,
          { text: inputText, type: 'input' },
          { text: summary, type: 'summarized' },
        ]);
      } catch (error) {
        console.error('Summarizing error:', error);
        alert('There was an error summarizing the text.');
      }

      setIsSummarizing(false);
    } else {
      alert('Text must be more than 50 words to summarize.');
    }
  };

  
  const handleSummarizeStreaming = async () => {
    if (inputText.trim().split(' ').length > 30) {
      setIsSummarizing(true);
      try {

        const available = (await self.ai.summarizer.capabilities()).available;

        let summarizer;
        if (available === 'no') {
          alert('Summarizer API is not available.');
          return;
        }

        const options = {
          sharedContext: 'This is a general article.',
          type: 'key-points',
          format: 'markdown',
          length: 'medium',
        };

        if (available === 'readily') {
          summarizer = await self.ai.summarizer.create(options);
        } else if (available === 'after-download') {
          summarizer = await self.ai.summarizer.create(options);
          summarizer.addEventListener('downloadprogress', (e) => {
            console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
          await summarizer.ready;
        }

     
        const stream = await summarizer.summarizeStreaming(inputText);
        let result = '';
        let previousLength = 0;
        for await (const segment of stream) {
          const newContent = segment.slice(previousLength);
          result += newContent;
          previousLength = segment.length;
          console.log(newContent);
        }

        setSummarizedText(result);

        // Add input and summarized message to chat
        setMessages([
          ...messages,
          { text: inputText, type: 'input' },
          { text: result, type: 'summarized' },
        ]);
      } catch (error) {
        console.error('Streaming Summarizing error:', error);
        alert('There was an error summarizing the text.');
      }

      setIsSummarizing(false);
    } else {
      alert('Text must be more than 50 words to summarize.');
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-">
      <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-4 ">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.type === 'input' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg ${msg.type === 'input' ? 'bg-purple-800 text-white' : msg.type === 'summarized' ? 'bg-yellow-300 text-black' : 'bg-gray-100 text-black'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2 mb-4">
        <select
          value={sourceLanguage}
          onChange={handleSourceLanguageChange}
          className="p-2 border-2  border-purple-800/50 rounded-4xl"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
        </select>

        <select
          value={targetLanguage}
          onChange={handleTargetLanguageChange}
          className="p-2 rounded-4xl border-2 border-purple-800/50 "
        >
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="es">Spanish</option>
        </select>
      </div>

      <textarea
        value={inputText}
        onChange={handleInputChange}
        placeholder="Enter text to translate or summarize"
        rows="3"
        className="p-3  border-2 border-purple-800/30 rounded-4xl mb-4 w-full"
      />

      <div className="flex justify-center gap-10 ">
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="w-[500px] p-3 bg-purple-800 font-semibold text-white rounded-4xl  disabled:opacity-50 mb-2"
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </button>

        <button
          onClick={handleSummarize}
          disabled={isSummarizing}
          className="p-3 border-2 border-purple-800 font-semibold text-black rounded-4xl w-[500px] disabled:opacity-50"
        >
          {isSummarizing ? 'Summarizing...' : 'Summarize Text'}
        </button>
      </div>

      {summarizedText && (
        <div className="mt-4 p-4 bg-red-700 border rounded">
          <h3 className="font-bold text-black">Summarized Text:</h3>
          <p>{summarizedText}</p>
        </div>
      )}
    </div>
  );
};

export default Sum;
