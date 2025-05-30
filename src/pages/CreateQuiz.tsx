
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, Save, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
  timeLimit: number;
}

interface Quiz {
  title: string;
  description: string;
  questions: Question[];
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    question: '',
    answers: [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
      { id: '3', text: '', isCorrect: false },
      { id: '4', text: '', isCorrect: false }
    ],
    timeLimit: 30
  });

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast({ title: "Please enter a question", variant: "destructive" });
      return;
    }

    const hasCorrectAnswer = currentQuestion.answers.some(answer => answer.isCorrect && answer.text.trim());
    const hasMultipleAnswers = currentQuestion.answers.filter(answer => answer.text.trim()).length >= 2;

    if (!hasCorrectAnswer) {
      toast({ title: "Please select a correct answer", variant: "destructive" });
      return;
    }

    if (!hasMultipleAnswers) {
      toast({ title: "Please provide at least 2 answer options", variant: "destructive" });
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString(),
      answers: currentQuestion.answers.filter(answer => answer.text.trim())
    };

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Reset current question
    setCurrentQuestion({
      id: '',
      question: '',
      answers: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false }
      ],
      timeLimit: 30
    });

    toast({ title: "Question added successfully!" });
  };

  const removeQuestion = (questionId: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateAnswer = (answerId: string, text: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: prev.answers.map(answer =>
        answer.id === answerId ? { ...answer, text } : answer
      )
    }));
  };

  const toggleCorrectAnswer = (answerId: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      answers: prev.answers.map(answer => ({
        ...answer,
        isCorrect: answer.id === answerId ? !answer.isCorrect : false
      }))
    }));
  };

  const saveQuiz = () => {
    if (!quiz.title.trim()) {
      toast({ title: "Please enter a quiz title", variant: "destructive" });
      return;
    }

    if (quiz.questions.length === 0) {
      toast({ title: "Please add at least one question", variant: "destructive" });
      return;
    }

    // Save to localStorage for demo purposes
    const quizId = Date.now().toString();
    const savedQuiz = { ...quiz, id: quizId };
    localStorage.setItem(`quiz_${quizId}`, JSON.stringify(savedQuiz));

    toast({ title: "Quiz saved successfully!" });
    navigate(`/host/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-white">Create Your Quiz</h1>
          <Button 
            onClick={saveQuiz}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Quiz
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quiz Info */}
          <div className="lg:col-span-1">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Quiz Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={quiz.title}
                    onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter quiz title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={quiz.description}
                    onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your quiz"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Questions ({quiz.questions.length})</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm truncate">{index + 1}. {question.question}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Builder */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-gray-800">Add Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter your question"
                    className="mt-1 text-lg"
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {currentQuestion.answers.map((answer, index) => (
                    <div key={answer.id} className="space-y-2">
                      <Label>Answer {index + 1}</Label>
                      <div className="flex gap-2">
                        <Input
                          value={answer.text}
                          onChange={(e) => updateAnswer(answer.id, e.target.value)}
                          placeholder={`Answer option ${index + 1}`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant={answer.isCorrect ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCorrectAnswer(answer.id)}
                          className={answer.isCorrect ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {answer.isCorrect ? "✓" : "○"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={currentQuestion.timeLimit}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                      className="w-20"
                      min="5"
                      max="120"
                    />
                  </div>
                  <Button onClick={addQuestion} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
