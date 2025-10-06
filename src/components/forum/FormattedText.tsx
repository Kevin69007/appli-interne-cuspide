
import FormattedTextSafe from "./FormattedTextSafe";

interface FormattedTextProps {
  content: string;
  className?: string;
}

const FormattedText = ({ content, className = "" }: FormattedTextProps) => {
  return <FormattedTextSafe content={content} className={className} />;
};

export default FormattedText;
