import { ChangeEvent, KeyboardEvent, FC } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
}

const SearchBar: FC<SearchBarProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  onSearch,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch(value);
    }
  };

  return (
    <div className="flex w-full">
      <div className="relative flex-grow">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          className="pr-10 w-full rounded-r-none"
        />
      </div>
      <Button
        type="button"
        className="rounded-l-none bg-primary hover:bg-primary-dark"
        onClick={() => onSearch(value)}
      >
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
};

export default SearchBar;
